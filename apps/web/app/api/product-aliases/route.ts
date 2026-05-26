import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const [aliases, products] = await Promise.all([
    prisma.productAlias.findMany({
      include: { product: { select: { id: true, name: true } } },
      orderBy: { alias: "asc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { salesLines: true, purchaseLines: true } },
        aliases: { select: { alias: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  return NextResponse.json({ aliases, products });
}

/**
 * POST body:
 *   { alias: string, productId: string, merge?: boolean }
 *
 * When merge=true (default when alias matches an existing Product name):
 *   - Creates/updates the ProductAlias record
 *   - Reassigns all PurchaseLines & InventoryMovements from the alias-product
 *     to the canonical productId
 *   This makes "other parts of the system" automatically show the correct product.
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();

  const { alias, productId, merge = true } = (await req.json()) as {
    alias: string;
    productId: string;
    merge?: boolean;
  };

  if (!alias || !productId) {
    return NextResponse.json({ error: "alias 和 productId 必填" }, { status: 400 });
  }

  // Upsert alias record
  const aliasRecord = await prisma.productAlias.upsert({
    where: { alias },
    create: { alias, productId },
    update: { productId },
    include: { product: { select: { id: true, name: true } } },
  });

  // Retroactive merge: if there's a standalone Product whose name matches the alias,
  // reassign its purchase lines and inventory movements to the canonical product.
  if (merge) {
    const aliasProduct = await prisma.product.findUnique({ where: { name: alias } });
    if (aliasProduct && aliasProduct.id !== productId) {
      await Promise.all([
        prisma.purchaseLine.updateMany({
          where: { productId: aliasProduct.id },
          data: { productId },
        }),
        prisma.inventoryMovement.updateMany({
          where: { productId: aliasProduct.id },
          data: { productId },
        }),
        // Also move any salesLines that might reference the alias product
        prisma.salesLine.updateMany({
          where: { productId: aliasProduct.id },
          data: { productId },
        }),
      ]);
    }
  }

  return NextResponse.json(aliasRecord);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { alias } = await req.json();
  await prisma.productAlias.delete({ where: { alias } });
  return NextResponse.json({ ok: true });
}
