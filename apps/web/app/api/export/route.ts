import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { exportFullWorkbook, exportReportSheet } from "@repo/database/src/excel/exporter";
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

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "full";
  const filters = parseReportFilters(searchParams);

  let buffer: Buffer;
  let filename = "export.xlsx";

  if (type === "full") {
    buffer = await exportFullWorkbook();
    filename = "集采联盟_数据导出.xlsx";
  } else if (type === "overview") {
    const data = await getOverview(filters);
    buffer = await exportReportSheet(
      "经营总览",
      ["日期", "结算金额", "开单金额", "笔数"],
      data.dailyTrend.map((d) => [d.date, d.settlement, d.order, d.count]),
    );
    filename = "经营总览.xlsx";
  } else if (type === "daily") {
    const data = await getDailySales(filters);
    buffer = await exportReportSheet(
      "销售日报",
      ["日期", "开单金额", "结算金额", "退货金额", "数量", "笔数"],
      data.map((d) => [
        d.date,
        d.orderAmount,
        d.settlementAmount,
        d.returnAmount,
        d.quantity,
        d.count,
      ]),
    );
    filename = "销售日报.xlsx";
  } else if (type === "customers") {
    const data = await getCustomerReport(filters);
    buffer = await exportReportSheet(
      "客户分析",
      ["客户", "开单金额", "结算金额", "退货", "未收款", "笔数"],
      data.map((d) => [
        d.customerName,
        d.orderAmount,
        d.settlementAmount,
        d.returnAmount,
        d.unpaidAmount,
        d.count,
      ]),
    );
    filename = "客户分析.xlsx";
  } else if (type === "products") {
    const data = await getProductReport(filters);
    buffer = await exportReportSheet(
      "商品分析",
      ["商品", "开单金额", "结算金额", "销量", "退货量", "笔数"],
      data.map((d) => [
        d.productName,
        d.orderAmount,
        d.settlementAmount,
        d.finalQty,
        d.returnQty,
        d.count,
      ]),
    );
    filename = "商品分析.xlsx";
  } else if (type === "venues") {
    const data = await getVenueReport(filters);
    buffer = await exportReportSheet(
      "场所分析",
      ["场所", "结算金额", "开单金额", "笔数"],
      data.map((d) => [
        d.venueCode,
        d.settlementAmount,
        d.orderAmount,
        d.count,
      ]),
    );
    filename = "场所分析.xlsx";
  } else if (type === "payments") {
    const data = await getPaymentReport(filters);
    buffer = await exportReportSheet(
      "未收款明细",
      ["日期", "客户", "商品", "结算", "未收", "状态"],
      data.unpaidLines.map((l) => [
        l.date,
        l.customer,
        l.product,
        l.settlement,
        l.unpaid,
        l.status,
      ]),
    );
    filename = "收款分析.xlsx";
  } else if (type === "prices") {
    const data = await getPriceQuoteReport(filters);
    buffer = await exportReportSheet(
      "报价对比",
      ["日期", "商品", "双福价", "集采价", "会员价"],
      data.map((d) => [d.date, d.product, d.shuangfu, d.alliance, d.member]),
    );
    filename = "报价对比.xlsx";
  } else if (type === "inventory") {
    const data = await getInventoryReport(filters);
    buffer = await exportReportSheet(
      "进销存简表",
      ["商品", "采购入库", "销售出库", "退货入库", "调整", "期末"],
      data.map((d) => [
        d.productName,
        d.purchaseIn,
        d.saleOut,
        d.returnIn,
        d.adjust,
        d.closing,
      ]),
    );
    filename = "进销存简表.xlsx";
  } else {
    return NextResponse.json({ error: "未知导出类型" }, { status: 400 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
