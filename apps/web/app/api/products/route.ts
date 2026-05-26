import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      unit: true,
      isDeposit: true,
      groupName: true,
      _count: { select: { salesLines: true, purchaseLines: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

/** PATCH body: { id: string, groupName: string | null } */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { id, groupName } = (await req.json()) as {
    id: string;
    groupName: string | null;
  };
  if (!id) return NextResponse.json({ error: "id 必填" }, { status: 400 });

  const product = await prisma.product.update({
    where: { id },
    data: { groupName: groupName?.trim() || null },
    select: { id: true, name: true, groupName: true },
  });
  return NextResponse.json(product);
}
