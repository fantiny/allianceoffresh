import { prisma } from "../index";
import type { ParsedPurchaseWorkbook } from "./purchase-parser";

export type PurchaseImportMode = "replace" | "append";

export type PurchaseImportResult = {
  stats: {
    orders: number;
    lines: number;
    inventory: number;
    newProducts: number;
  };
  unmapped: string[]; // purchase product names that had no alias/match → created as new products
  warnings: string[];
};

/**
 * Import parsed purchase rows into PurchaseOrder / PurchaseLine tables.
 *
 * Product name resolution order:
 *   1. ProductAlias (alias = purchaseName) → use mapped product
 *   2. Product (name = purchaseName) → exact match
 *   3. Create new Product with the purchase name (user can add alias later)
 *
 * Orders are grouped by (purchaseDate, supplier).
 */
export async function importPurchaseWorkbook(
  data: ParsedPurchaseWorkbook,
  options: {
    mode: PurchaseImportMode;
    autoInventory?: boolean;
  },
): Promise<PurchaseImportResult> {
  const warnings = [...data.warnings];
  const autoInventory = options.autoInventory ?? true;

  // ── 1. Clear existing purchase data in replace mode ────────────────────────
  if (options.mode === "replace") {
    // PurchaseLine is cascade-deleted when PurchaseOrder is deleted
    await prisma.purchaseOrder.deleteMany();
    // Also clear purchase_in inventory movements
    await prisma.inventoryMovement.deleteMany({ where: { type: "purchase_in" } });
  }

  if (data.rows.length === 0) {
    return {
      stats: { orders: 0, lines: 0, inventory: 0, newProducts: 0 },
      unmapped: [],
      warnings,
    };
  }

  // ── 2. Collect unique product names in purchase file ───────────────────────
  const purchaseProductNames = [...new Set(data.rows.map((r) => r.productName))];

  // ── 3. Fetch existing aliases and products ─────────────────────────────────
  const [aliases, existingProducts] = await Promise.all([
    prisma.productAlias.findMany({ select: { alias: true, productId: true } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);

  const aliasMap = new Map(aliases.map((a) => [a.alias, a.productId]));
  const productNameMap = new Map(existingProducts.map((p) => [p.name, p.id]));

  // ── 4. Resolve or create products for unmapped purchase names ──────────────
  const unmapped: string[] = [];
  const resolvedMap = new Map<string, string>(); // purchaseName → productId

  for (const name of purchaseProductNames) {
    // 1. Check alias
    const aliasId = aliasMap.get(name);
    if (aliasId) {
      resolvedMap.set(name, aliasId);
      continue;
    }
    // 2. Exact product match
    const exactId = productNameMap.get(name);
    if (exactId) {
      resolvedMap.set(name, exactId);
      continue;
    }
    // 3. Create new product with purchase name
    unmapped.push(name);
  }

  let newProductCount = 0;
  if (unmapped.length > 0) {
    await prisma.product.createMany({
      data: unmapped.map((name) => ({
        name,
        unit: "斤",
        isDeposit: name.includes("押金"),
      })),
      skipDuplicates: true,
    });
    // Re-fetch to get IDs
    const newProds = await prisma.product.findMany({
      where: { name: { in: unmapped } },
      select: { id: true, name: true },
    });
    for (const p of newProds) {
      resolvedMap.set(p.name, p.id);
    }
    newProductCount = unmapped.length;
  }

  // ── 5. Group rows by (date, supplier) → PurchaseOrders ────────────────────
  type OrderKey = string;
  type OrderGroup = {
    purchaseDate: Date;
    supplier: string;
    lines: typeof data.rows;
  };

  const orderMap = new Map<OrderKey, OrderGroup>();
  for (const row of data.rows) {
    const key = `${row.purchaseDate.toISOString()}__${row.supplier}`;
    if (!orderMap.has(key)) {
      orderMap.set(key, { purchaseDate: row.purchaseDate, supplier: row.supplier, lines: [] });
    }
    orderMap.get(key)!.lines.push(row);
  }

  // ── 6. Insert PurchaseOrders + PurchaseLines ───────────────────────────────
  let orderCount = 0;
  let lineCount = 0;
  const inventoryMovements: {
    moveDate: Date;
    productId: string;
    type: string;
    quantity: number;
    remark: string;
    refId: string;
  }[] = [];

  for (const group of orderMap.values()) {
    const validLines = group.lines
      .map((row) => {
        const productId = resolvedMap.get(row.productName);
        if (!productId) {
          warnings.push(`无法找到商品「${row.productName}」，跳过该行`);
          return null;
        }
        return {
          productId,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          amount: row.amount || row.quantity * row.unitPrice,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    if (validLines.length === 0) continue;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderDate: group.purchaseDate,
        supplier: group.supplier,
        lines: { create: validLines },
      },
      include: { lines: true },
    });

    orderCount++;
    lineCount += order.lines.length;

    if (autoInventory) {
      for (const line of order.lines) {
        inventoryMovements.push({
          moveDate: order.orderDate,
          productId: line.productId,
          type: "purchase_in",
          quantity: line.quantity,
          remark: `采购 ${group.supplier}`,
          refId: order.id,
        });
      }
    }
  }

  // ── 7. Batch insert inventory movements ───────────────────────────────────
  if (inventoryMovements.length > 0) {
    await prisma.inventoryMovement.createMany({
      data: inventoryMovements,
      skipDuplicates: true,
    });
  }

  return {
    stats: {
      orders: orderCount,
      lines: lineCount,
      inventory: inventoryMovements.length,
      newProducts: newProductCount,
    },
    unmapped,
    warnings,
  };
}
