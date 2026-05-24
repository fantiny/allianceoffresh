import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const orders = await prisma.purchaseOrder.findMany({
    include: { lines: { include: { product: true } } },
    orderBy: { orderDate: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const body = await req.json();
  const { orderDate, supplier, remark, lines } = body as {
    orderDate: string;
    supplier: string;
    remark?: string;
    lines: { productId: string; quantity: number; unitPrice: number }[];
  };

  const order = await prisma.purchaseOrder.create({
    data: {
      orderDate: new Date(orderDate),
      supplier,
      remark,
      lines: {
        create: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.quantity * l.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });

  const autoInventory = process.env.AUTO_INVENTORY !== "false";
  if (autoInventory) {
    for (const line of order.lines) {
      await prisma.inventoryMovement.create({
        data: {
          moveDate: order.orderDate,
          productId: line.productId,
          type: "purchase_in",
          quantity: line.quantity,
          remark: `采购 ${supplier}`,
          refId: order.id,
        },
      });
    }
  }

  return NextResponse.json(order);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { id } = await req.json();
  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
