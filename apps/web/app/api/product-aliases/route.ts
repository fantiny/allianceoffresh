import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const aliases = await prisma.productAlias.findMany({
    include: { product: { select: { id: true, name: true } } },
    orderBy: { alias: "asc" },
  });
  return NextResponse.json(aliases);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { alias, productId } = await req.json();
  if (!alias || !productId) {
    return NextResponse.json({ error: "alias 和 productId 必填" }, { status: 400 });
  }
  // upsert so setting alias twice just updates the mapping
  const result = await prisma.productAlias.upsert({
    where: { alias },
    create: { alias, productId },
    update: { productId },
    include: { product: { select: { id: true, name: true } } },
  });
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { alias } = await req.json();
  await prisma.productAlias.delete({ where: { alias } });
  return NextResponse.json({ ok: true });
}
