import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { buildSalesWhere, parseReportFilters } from "@repo/shared";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const filters = parseReportFilters(req.nextUrl.searchParams);
  const where = buildSalesWhere(filters);
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 50;
  const [items, total, agg] = await Promise.all([
    prisma.salesLine.findMany({
      where,
      include: {
        customer: true,
        product: true,
        venue: true,
        paymentStatus: true,
      },
      orderBy: [{ deliveryDate: "desc" }, { lineNo: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesLine.count({ where }),
    prisma.salesLine.aggregate({
      where,
      _sum: { settlementAmount: true, unpaidAmount: true },
    }),
  ]);
  return NextResponse.json({
    items,
    total,
    page,
    limit,
    summary: {
      settlementAmount: agg._sum.settlementAmount ?? 0,
      unpaidAmount: agg._sum.unpaidAmount ?? 0,
    },
  });
}

/**
 * PATCH: update payment status / unpaid amount for a single sales line.
 * Body: { id, paymentStatusId, unpaidAmount, unpaidExDeposit }
 */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const body = (await req.json()) as {
    id: string;
    paymentStatusId?: string;
    unpaidAmount?: number;
    unpaidExDeposit?: number;
  };
  if (!body.id) return NextResponse.json({ error: "id 必填" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.paymentStatusId !== undefined) data.paymentStatusId = body.paymentStatusId;
  if (body.unpaidAmount !== undefined) data.unpaidAmount = body.unpaidAmount;
  if (body.unpaidExDeposit !== undefined) data.unpaidExDeposit = body.unpaidExDeposit;

  const updated = await prisma.salesLine.update({
    where: { id: body.id },
    data,
    include: {
      customer: true,
      product: true,
      venue: true,
      paymentStatus: true,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { id } = await req.json();
  await prisma.salesLine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
