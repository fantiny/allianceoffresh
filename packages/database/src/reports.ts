import { prisma } from "./index";
import type { ReportFilters } from "@repo/shared";
import { buildSalesWhere } from "@repo/shared";

// ── helpers ───────────────────────────────────────────────────────────────────

/** The display/group label for a product: custom groupName first, then name. */
function productLabel(p: { name: string; groupName: string | null }): string {
  return p.groupName?.trim() || p.name;
}

/** The display/group label for a customer: custom groupName first, then name. */
function customerLabel(c: { name: string; groupName: string | null }): string {
  return c.groupName?.trim() || c.name;
}

// ── Overview ─────────────────────────────────────────────────────────────────

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

// ── Daily Sales ───────────────────────────────────────────────────────────────

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

// ── Customer Report ───────────────────────────────────────────────────────────

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

  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, groupName: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // Merge rows by groupName (or customer name if no group)
  type GroupRow = {
    customerIds: string[];
    label: string;
    orderAmount: number;
    settlementAmount: number;
    returnAmount: number;
    unpaidAmount: number;
    unpaidExDeposit: number;
    count: number;
  };
  const grouped = new Map<string, GroupRow>();

  for (const row of rows) {
    const c = customerMap.get(row.customerId);
    const label = c ? customerLabel(c) : "未知";
    if (!grouped.has(label)) {
      grouped.set(label, {
        customerIds: [],
        label,
        orderAmount: 0,
        settlementAmount: 0,
        returnAmount: 0,
        unpaidAmount: 0,
        unpaidExDeposit: 0,
        count: 0,
      });
    }
    const g = grouped.get(label)!;
    g.customerIds.push(row.customerId);
    g.orderAmount += row._sum.orderAmount ?? 0;
    g.settlementAmount += row._sum.settlementAmount ?? 0;
    g.returnAmount += row._sum.returnAmount ?? 0;
    g.unpaidAmount += row._sum.unpaidAmount ?? 0;
    g.unpaidExDeposit += row._sum.unpaidExDeposit ?? 0;
    g.count += row._count;
  }

  return [...grouped.values()]
    .sort((a, b) => b.settlementAmount - a.settlementAmount)
    .map((g) => ({
      customerId: g.customerIds[0],
      customerName: g.label,
      orderAmount: g.orderAmount,
      settlementAmount: g.settlementAmount,
      returnAmount: g.returnAmount,
      unpaidAmount: g.unpaidAmount,
      unpaidExDeposit: g.unpaidExDeposit,
      count: g.count,
    }));
}

// ── Product Report ────────────────────────────────────────────────────────────

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

  const products = await prisma.product.findMany({
    select: { id: true, name: true, isDeposit: true, groupName: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Merge rows by groupName (or product name if no group)
  type GroupRow = {
    productIds: string[];
    label: string;
    isDeposit: boolean;
    orderAmount: number;
    settlementAmount: number;
    returnAmount: number;
    finalQty: number;
    returnQty: number;
    count: number;
  };
  const grouped = new Map<string, GroupRow>();

  for (const row of rows) {
    const p = productMap.get(row.productId);
    const label = p ? productLabel(p) : "未知";
    if (!grouped.has(label)) {
      grouped.set(label, {
        productIds: [],
        label,
        isDeposit: p?.isDeposit ?? false,
        orderAmount: 0,
        settlementAmount: 0,
        returnAmount: 0,
        finalQty: 0,
        returnQty: 0,
        count: 0,
      });
    }
    const g = grouped.get(label)!;
    g.productIds.push(row.productId);
    g.orderAmount += row._sum.orderAmount ?? 0;
    g.settlementAmount += row._sum.settlementAmount ?? 0;
    g.returnAmount += row._sum.returnAmount ?? 0;
    g.finalQty += row._sum.finalQty ?? 0;
    g.returnQty += row._sum.returnQty ?? 0;
    g.count += row._count;
  }

  return [...grouped.values()]
    .sort((a, b) => b.settlementAmount - a.settlementAmount)
    .map((g) => ({
      productId: g.productIds[0],
      productName: g.label,
      isDeposit: g.isDeposit,
      orderAmount: g.orderAmount,
      settlementAmount: g.settlementAmount,
      returnAmount: g.returnAmount,
      finalQty: g.finalQty,
      returnQty: g.returnQty,
      count: g.count,
    }));
}

// ── Venue Report ─────────────────────────────────────────────────────────────

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

// ── Payment Report ────────────────────────────────────────────────────────────

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
      customer: customerLabel(l.customer),
      product: productLabel(l.product),
      settlement: l.settlementAmount,
      unpaid: l.unpaidAmount,
      status: l.paymentStatus.name,
    })),
  };
}

// ── Price Quote Report ────────────────────────────────────────────────────────

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
    product: productLabel(q.product),
    shuangfu: q.shuangfuPrice,
    alliance: q.alliancePrice,
    member: q.memberPrice,
  }));
}

// ── Inventory Report ──────────────────────────────────────────────────────────

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
          ? { purchaseOrder: { orderDate: dateFilter } }
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
      productName: productLabel(product),
      purchaseIn,
      saleOut: saleOut || soldQty,
      returnIn: returnIn || returnedQty,
      adjust,
      closing: purchaseIn - saleOut + returnIn + adjust,
    });
  }

  return results.sort((a, b) => b.saleOut - a.saleOut);
}
