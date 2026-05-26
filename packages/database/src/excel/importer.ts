import { createHash } from "crypto";
import { prisma } from "../index";
import type { ParsedWorkbook, ParsedSalesRow } from "./parser";

export type ImportMode = "replace" | "append";

export type ImportResult = {
  batchId: string;
  stats: {
    sales: number;
    quotes: number;
    aliases: number;
    inventory: number;
  };
  warnings: string[];
};

/**
 * Batch-optimised importer.
 *
 * Old approach: N rows × ~6 individual DB round-trips  → easily >60 s for 500 rows.
 * New approach: ~12 total DB calls regardless of row count → typically <5 s.
 *
 * Strategy:
 *   1. Collect all unique reference values (products, customers, …) up front.
 *   2. createMany(skipDuplicates) for each reference table.
 *   3. Fetch ID maps in parallel.
 *   4. Build all line-item rows in memory, then createMany in one shot.
 */
export async function importWorkbook(
  data: ParsedWorkbook,
  options: {
    filename: string;
    buffer: Buffer;
    mode: ImportMode;
    autoInventory?: boolean;
  },
): Promise<ImportResult> {
  const warnings = [...data.warnings];
  const fileHash = createHash("sha256").update(options.buffer).digest("hex");
  const autoInventory = options.autoInventory ?? true;

  // ── 1. Clear existing data (replace mode) ──────────────────────────────────
  if (options.mode === "replace") {
    // Run deletes in parallel – each is fast (single statement)
    await Promise.all([
      prisma.inventoryMovement.deleteMany(),
      prisma.salesLine.deleteMany(),
      prisma.priceQuote.deleteMany(),
    ]);
  }

  // ── 2. Collect unique entity names ─────────────────────────────────────────

  // alias → canonical product name (from explicit alias table + quoteProductName hints)
  const aliasToProductName = new Map<string, string>();
  for (const a of data.aliases) {
    aliasToProductName.set(a.alias, a.productName);
  }
  for (const row of data.sales) {
    if (row.quoteProductName && row.quoteProductName !== row.productName) {
      if (!aliasToProductName.has(row.quoteProductName)) {
        aliasToProductName.set(row.quoteProductName, row.productName);
      }
    }
  }

  // All canonical product names that must exist
  const allProductNames = new Set<string>();
  for (const a of data.aliases) allProductNames.add(a.productName);
  for (const q of data.quotes) allProductNames.add(q.productName);
  for (const row of data.sales) allProductNames.add(row.productName);

  const uniqueCustomers = [...new Set(data.sales.map((r) => r.customerName))];
  const uniqueVenues = [...new Set(data.sales.map((r) => r.venueCode))];
  const uniquePaymentStatuses = [
    ...new Set([
      ...data.paymentStatuses,
      ...data.sales.map((r) => r.paymentStatus),
    ]),
  ];

  // ── 3. Batch upsert reference entities ─────────────────────────────────────
  await Promise.all([
    prisma.product.createMany({
      data: [...allProductNames].map((name) => ({
        name,
        unit: "斤",
        isDeposit: name.includes("押金"),
      })),
      skipDuplicates: true,
    }),
    prisma.customer.createMany({
      data: uniqueCustomers.map((name) => ({ name })),
      skipDuplicates: true,
    }),
    prisma.venue.createMany({
      data: uniqueVenues.map((code) => ({ code })),
      skipDuplicates: true,
    }),
    prisma.paymentStatus.createMany({
      data: uniquePaymentStatuses.map((name) => ({ name })),
      skipDuplicates: true,
    }),
  ]);

  // ── 4. Fetch ID maps in parallel ───────────────────────────────────────────
  const [products, customers, venues, paymentStatuses] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true } }),
    prisma.customer.findMany({ select: { id: true, name: true } }),
    prisma.venue.findMany({ select: { id: true, code: true } }),
    prisma.paymentStatus.findMany({ select: { id: true, name: true } }),
  ]);

  const productMap = new Map(products.map((p) => [p.name, p.id]));
  const customerMap = new Map(customers.map((c) => [c.name, c.id]));
  const venueMap = new Map(venues.map((v) => [v.code, v.id]));
  const paymentMap = new Map(paymentStatuses.map((p) => [p.name, p.id]));

  // ── 5. Batch upsert product aliases ────────────────────────────────────────
  const aliasRows = data.aliases
    .map((a) => ({ alias: a.alias, productId: productMap.get(a.productName) }))
    .filter((a): a is { alias: string; productId: string } => !!a.productId);

  if (aliasRows.length > 0) {
    await prisma.productAlias.createMany({
      data: aliasRows,
      skipDuplicates: true,
    });
  }

  // Build alias → productId map (covers explicit aliases + quoteProductName hints)
  const aliasProductIdMap = new Map<string, string>();
  for (const [alias, productName] of aliasToProductName) {
    const pid = productMap.get(productName);
    if (pid) aliasProductIdMap.set(alias, pid);
  }

  // Helper: resolve productId for a sales row
  const resolveProductId = (row: ParsedSalesRow): string | undefined => {
    const key = row.quoteProductName || row.productName;
    return (
      aliasProductIdMap.get(key) ||
      productMap.get(row.productName) ||
      productMap.get(key)
    );
  };

  // ── 6. Batch insert price quotes ───────────────────────────────────────────
  let quoteCount = 0;
  if (data.quotes.length > 0) {
    const quoteData = data.quotes
      .map((q) => {
        const productId = productMap.get(q.productName);
        if (!productId) return null;
        return {
          quoteDate: q.quoteDate,
          seqNo: q.seqNo ?? "",
          productId,
          unit: q.unit,
          shuangfuPrice: q.shuangfuPrice,
          alliancePrice: q.alliancePrice,
          memberPrice: q.memberPrice,
          spec: q.spec,
          remark: q.remark,
          adjustNote: q.adjustNote,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    if (quoteData.length > 0) {
      await prisma.priceQuote.createMany({
        data: quoteData,
        skipDuplicates: true,
      });
    }
    quoteCount = quoteData.length;
  }

  // ── 7. Batch insert sales lines ────────────────────────────────────────────
  let salesCount = 0;
  const skipped: string[] = [];

  if (data.sales.length > 0) {
    const salesData = data.sales
      .map((row) => {
        const customerId = customerMap.get(row.customerName);
        const venueId = venueMap.get(row.venueCode);
        const productId = resolveProductId(row);
        const paymentStatusId = paymentMap.get(row.paymentStatus);

        if (!customerId || !venueId || !productId || !paymentStatusId) {
          skipped.push(
            `行 ${row.lineNo}: 缺少 ${!customerId ? "客户" : !venueId ? "场地" : !productId ? "商品" : "付款状态"}`,
          );
          return null;
        }

        return {
          lineNo: row.lineNo,
          deliveryDate: row.deliveryDate,
          invoiceNo: row.invoiceNo ?? "",
          customerId,
          venueId,
          productId,
          quoteProductName: row.quoteProductName,
          unit: row.unit,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          standardPrice: row.standardPrice,
          orderAmount: row.orderAmount,
          actualPrice: row.actualPrice,
          returnQty: row.returnQty,
          returnAmount: row.returnAmount,
          finalQty: row.finalQty,
          settlementAmount: row.settlementAmount,
          returnReason: row.returnReason,
          returnInvoiceNo: row.returnInvoiceNo,
          paymentStatusId,
          unpaidAmount: row.unpaidAmount,
          unpaidExDeposit: row.unpaidExDeposit,
          remark: row.remark,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (salesData.length > 0) {
      await prisma.salesLine.createMany({
        data: salesData,
        skipDuplicates: true,
      });
    }
    salesCount = salesData.length;
    if (skipped.length > 0) warnings.push(...skipped.slice(0, 20));
  }

  // ── 8. Batch insert inventory movements ────────────────────────────────────
  let inventoryCount = 0;

  if (autoInventory && data.sales.length > 0) {
    const movements: {
      moveDate: Date;
      productId: string;
      type: string;
      quantity: number;
      remark: string;
      refId: string;
    }[] = [];

    for (const row of data.sales) {
      const productId = resolveProductId(row);
      if (!productId) continue;
      const invoiceKey = row.invoiceNo ?? String(row.lineNo);

      if (row.finalQty > 0) {
        movements.push({
          moveDate: row.deliveryDate,
          productId,
          type: "sale_out",
          quantity: -row.finalQty,
          remark: `销售 ${row.customerName}`,
          refId: invoiceKey,
        });
      }
      if (row.returnQty > 0) {
        movements.push({
          moveDate: row.deliveryDate,
          productId,
          type: "return_in",
          quantity: row.returnQty,
          remark: `退货 ${row.customerName}`,
          refId: invoiceKey,
        });
      }
    }

    if (movements.length > 0) {
      await prisma.inventoryMovement.createMany({
        data: movements,
        skipDuplicates: true,
      });
    }
    inventoryCount = movements.length;
  }

  // ── 9. Record import batch & ensure default settings ───────────────────────
  const batch = await prisma.importBatch.create({
    data: {
      filename: options.filename,
      fileHash,
      mode: options.mode,
      stats: JSON.stringify({
        sales: salesCount,
        quotes: quoteCount,
        aliases: data.aliases.length,
        inventory: inventoryCount,
      }),
      warnings: warnings.length ? JSON.stringify(warnings) : null,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "company_name" },
    create: { key: "company_name", value: "重庆迅马水产品销售有限公司" },
    update: {},
  });

  return {
    batchId: batch.id,
    stats: {
      sales: salesCount,
      quotes: quoteCount,
      aliases: data.aliases.length,
      inventory: inventoryCount,
    },
    warnings,
  };
}
