import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { buildSalesWhere, parseReportFilters } from "@repo/shared";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const filters = parseReportFilters(req.nextUrl.searchParams);
  const where = buildSalesWhere(filters);
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 50;
  const [items, total] = await Promise.all([
    prisma.salesLine.findMany({
      where,
      include: {
        customer: true,
        product: true,
        venue: true,
        paymentStatus: true,
      },
      orderBy: { deliveryDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesLine.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, limit });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { id } = await req.json();
  await prisma.salesLine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
