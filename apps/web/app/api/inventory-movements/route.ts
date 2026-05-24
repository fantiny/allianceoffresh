import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.inventoryMovement.findMany({
    include: { product: true },
    orderBy: { moveDate: "desc" },
    take: 200,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const body = await req.json();
  const item = await prisma.inventoryMovement.create({
    data: {
      moveDate: new Date(body.moveDate),
      productId: body.productId,
      type: body.type,
      quantity: Number(body.quantity),
      remark: body.remark,
    },
    include: { product: true },
  });
  return NextResponse.json(item);
}
