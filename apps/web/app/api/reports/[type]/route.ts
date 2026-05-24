import {
  getOverview,
  getDailySales,
  getCustomerReport,
  getProductReport,
  getVenueReport,
  getPaymentReport,
  getPriceQuoteReport,
  getInventoryReport,
} from "@repo/database/src/reports";
import { parseReportFilters } from "@repo/shared";
import { NextRequest, NextResponse } from "next/server";

const handlers: Record<string, (f: ReturnType<typeof parseReportFilters>) => Promise<unknown>> = {
  overview: getOverview,
  "daily-sales": getDailySales,
  customers: getCustomerReport,
  products: getProductReport,
  venues: getVenueReport,
  payments: getPaymentReport,
  "price-quotes": getPriceQuoteReport,
  inventory: getInventoryReport,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const handler = handlers[type];
  if (!handler) {
    return NextResponse.json({ error: "未知报表类型" }, { status: 404 });
  }
  const filters = parseReportFilters(req.nextUrl.searchParams);
  const data = await handler(filters);
  return NextResponse.json(data);
}
