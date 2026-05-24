import { prisma } from "./index";
import type { ReportFilters } from "@repo/shared";
import { buildSalesWhere } from "@repo/shared";

export async function getOverview(filters: ReportFilters) {
  const where = buildSalesWhere(filters);
  const agg = await prisma.salesLine.aggregate({
    where,
    _sum: {
      orderAmount: true,
      settlementAmount: true,
      unpaidAmount: true,
      returnAmount: true,
    },
    _count: true,
  });

  const orderTotal = agg._sum.orderAmount ?? 0;
  const settlementTotal = agg._sum.settlementAmount ?? 0;
  const unpaidTotal = agg._sum.unpaidAmount ?? 0;
  const returnTotal = agg._sum.returnAmount ?? 0;

  const daily = await prisma.salesLine.groupBy({
    by: ["deliveryDate"],
    where,
    _sum: { settlementAmount: true, orderAmount: true },
    _count: true,
    orderBy: { deliveryDate: "asc" },
  });

  const byPayment = await prisma.salesLine.groupBy({
    by: ["paymentStatusId"],
    where,
    _sum: { settlementAmount: true },
  });

  const paymentStatuses = await prisma.paymentStatus.findMany();
  const paymentMap = Object.fromEntries(
    paymentStatuses.map((p) => [p.id, p.name]),
  );

  return {
    kpis: {
      orderAmount: orderTotal,
      settlementAmount: settlementTotal,
      unpaidAmount: unpaidTotal,
      returnAmount: returnTotal,
      unpaidRate: settlementTotal ? unpaidTotal / settlementTotal : 0,
      returnRate: orderTotal ? returnTotal / orderTotal : 0,
      lineCount: agg._count,
    },
    dailyTrend: daily.map((d) => ({
      date: d.deliveryDate.toISOString().slice(0, 10),
      settlement: d._sum.settlementAmount ?? 0,
      order: d._sum.orderAmount ?? 0,
      count: d._count,
    })),
    paymentBreakdown: byPayment.map((p) => ({
      status: paymentMap[p.paymentStatusId] ?? "未知",
      amount: p._sum.settlementAmount ?? 0,
    })),
  };
}

export async function getDailySales(filters: ReportFilters) {
  const where = buildSalesWhere(filters);
  const rows = await prisma.salesLine.groupBy({
    by: ["deliveryDate"],
    where,
    _sum: {
      orderAmount: true,
      settlementAmount: true,
      returnAmount: true,
      quantity: true,
    },
    _count: true,
    orderBy: { deliveryDate: "asc" },
  });
  return rows.map((r) => ({
    date: r.deliveryDate.toISOString().slice(0, 10),
    orderAmount: r._sum.orderAmount ?? 0,
    settlementAmount: r._sum.settlementAmount ?? 0,
    returnAmount: r._sum.returnAmount ?? 0,
    quantity: r._sum.quantity ?? 0,
    count: r._count,
  }));
}

export async function getCustomerReport(filters: ReportFilters) {
  const where = buildSalesWhere(filters);
  const rows = await prisma.salesLine.groupBy({
    by: ["customerId"],
    where,
    _sum: {
      orderAmount: true,
      settlementAmount: true,
      returnAmount: true,
      unpaidAmount: true,
      unpaidExDeposit: true,
    },
    _count: true,
    orderBy: { _sum: { settlementAmount: "desc" } },
  });
  const customers = await prisma.customer.findMany();
  const map = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  return rows.map((r) => ({
    customerId: r.customerId,
    customerName: map[r.customerId] ?? "未知",
    orderAmount: r._sum.orderAmount ?? 0,
    settlementAmount: r._sum.settlementAmount ?? 0,
    returnAmount: r._sum.returnAmount ?? 0,
    unpaidAmount: r._sum.unpaidAmount ?? 0,
    unpaidExDeposit: r._sum.unpaidExDeposit ?? 0,
    count: r._count,
  }));
}

export async function getProductReport(filters: ReportFilters) {
  const where = buildSalesWhere(filters);
  const rows = await prisma.salesLine.groupBy({
    by: ["productId"],
    where,
    _sum: {
      orderAmount: true,
      settlementAmount: true,
      returnAmount: true,
      finalQty: true,
      returnQty: true,
    },
    _count: true,
    orderBy: { _sum: { settlementAmount: "desc" } },
  });
  const products = await prisma.product.findMany();
  const map = Object.fromEntries(products.map((p) => [p.id, p]));
  return rows.map((r) => ({
    productId: r.productId,
    productName: map[r.productId]?.name ?? "未知",
    isDeposit: map[r.productId]?.isDeposit ?? false,
    orderAmount: r._sum.orderAmount ?? 0,
    settlementAmount: r._sum.settlementAmount ?? 0,
    returnAmount: r._sum.returnAmount ?? 0,
    finalQty: r._sum.finalQty ?? 0,
    returnQty: r._sum.returnQty ?? 0,
    count: r._count,
  }));
}

export async function getVenueReport(filters: ReportFilters) {
  const where = buildSalesWhere(filters);
  const rows = await prisma.salesLine.groupBy({
    by: ["venueId"],
    where,
    _sum: { settlementAmount: true, orderAmount: true },
    _count: true,
  });
  const venues = await prisma.venue.findMany();
  const map = Object.fromEntries(venues.map((v) => [v.id, v.code]));
  return rows.map((r) => ({
    venueId: r.venueId,
    venueCode: map[r.venueId] ?? "未知",
    settlementAmount: r._sum.settlementAmount ?? 0,
    orderAmount: r._sum.orderAmount ?? 0,
    count: r._count,
  }));
}

export async function getPaymentReport(filters: ReportFilters) {
  const where = buildSalesWhere(filters);
  const unpaidLines = await prisma.salesLine.findMany({
    where: { ...where, unpaidAmount: { gt: 0 } },
    include: {
      customer: true,
      product: true,
      paymentStatus: true,
    },
    orderBy: { deliveryDate: "desc" },
    take: 500,
  });
  const byStatus = await prisma.salesLine.groupBy({
    by: ["paymentStatusId"],
    where,
    _sum: { settlementAmount: true, unpaidAmount: true },
    _count: true,
  });
  const statuses = await prisma.paymentStatus.findMany();
  const map = Object.fromEntries(statuses.map((s) => [s.id, s.name]));
  return {
    byStatus: byStatus.map((s) => ({
      status: map[s.paymentStatusId] ?? "未知",
      settlement: s._sum.settlementAmount ?? 0,
      unpaid: s._sum.unpaidAmount ?? 0,
      count: s._count,
    })),
    unpaidLines: unpaidLines.map((l) => ({
      id: l.id,
      date: l.deliveryDate.toISOString().slice(0, 10),
      customer: l.customer.name,
      product: l.product.name,
      settlement: l.settlementAmount,
      unpaid: l.unpaidAmount,
      status: l.paymentStatus.name,
    })),
  };
}

export async function getPriceQuoteReport(filters: ReportFilters) {
  const where: Record<string, unknown> = {};
  if (filters.from || filters.to) {
    where.quoteDate = {};
    if (filters.from)
      (where.quoteDate as Record<string, Date>).gte = new Date(filters.from);
    if (filters.to)
      (where.quoteDate as Record<string, Date>).lte = new Date(
        `${filters.to}T23:59:59`,
      );
  }
  if (filters.productId) where.productId = filters.productId;

  const quotes = await prisma.priceQuote.findMany({
    where,
    include: { product: true },
    orderBy: [{ quoteDate: "asc" }, { product: { name: "asc" } }],
  });

  return quotes.map((q) => ({
    date: q.quoteDate.toISOString().slice(0, 10),
    product: q.product.name,
    shuangfu: q.shuangfuPrice,
    alliance: q.alliancePrice,
    member: q.memberPrice,
  }));
}

export async function getInventoryReport(filters: ReportFilters) {
  const productWhere: Record<string, unknown> = {};
  if (filters.excludeDeposit) productWhere.isDeposit = false;
  if (filters.productId) productWhere.id = filters.productId;

  const products = await prisma.product.findMany({ where: productWhere });
  const dateFilter: Record<string, Date> = {};
  if (filters.from) dateFilter.gte = new Date(filters.from);
  if (filters.to) dateFilter.lte = new Date(`${filters.to}T23:59:59`);

  const results = [];
  for (const product of products) {
    const moveWhere: Record<string, unknown> = { productId: product.id };
    if (filters.from || filters.to) moveWhere.moveDate = dateFilter;

    const purchases = await prisma.purchaseLine.aggregate({
      where: {
        productId: product.id,
        ...(filters.from || filters.to
          ? {
              purchaseOrder: {
                orderDate: dateFilter,
              },
            }
          : {}),
      },
      _sum: { quantity: true },
    });

    const movements = await prisma.inventoryMovement.groupBy({
      by: ["type"],
      where: moveWhere,
      _sum: { quantity: true },
    });

    const sales = await prisma.salesLine.aggregate({
      where: {
        productId: product.id,
        ...(filters.from || filters.to ? { deliveryDate: dateFilter } : {}),
      },
      _sum: { finalQty: true, returnQty: true },
    });

    const byType = Object.fromEntries(
      movements.map((m) => [m.type, m._sum.quantity ?? 0]),
    );

    const purchaseIn = purchases._sum.quantity ?? 0;
    const saleOut = Math.abs(byType.sale_out ?? 0);
    const returnIn = byType.return_in ?? 0;
    const adjust = byType.adjust ?? 0;
    const soldQty = sales._sum.finalQty ?? 0;
    const returnedQty = sales._sum.returnQty ?? 0;

    results.push({
      productId: product.id,
      productName: product.name,
      purchaseIn,
      saleOut: saleOut || soldQty,
      returnIn: returnIn || returnedQty,
      adjust,
      closing: purchaseIn - saleOut + returnIn + adjust,
    });
  }

  return results.sort((a, b) => b.saleOut - a.saleOut);
}
