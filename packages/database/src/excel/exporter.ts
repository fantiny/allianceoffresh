import ExcelJS from "exceljs";
import { prisma } from "../index";
import { COMPANY_INFO } from "@repo/shared";

export async function exportFullWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const defs = wb.addWorksheet("基础定义表");
  defs.addRow(["结款状态"]);
  const statuses = await prisma.paymentStatus.findMany();
  for (const s of statuses) defs.addRow([s.name]);

  const aliasSheet = wb.addWorksheet("商品名别称");
  aliasSheet.addRow(["日常叫法", "商品名"]);
  const aliases = await prisma.productAlias.findMany({
    include: { product: true },
  });
  for (const a of aliases) aliasSheet.addRow([a.alias, a.product.name]);

  const quoteSheet = wb.addWorksheet("报价表");
  quoteSheet.addRow([
    "报价日期",
    "序号",
    "报价商品",
    "报价单位",
    "双福价格",
    "集采价格",
    "会员价格",
    "规格",
    "备注",
    "调价说明",
  ]);
  const quotes = await prisma.priceQuote.findMany({
    include: { product: true },
    orderBy: [{ quoteDate: "asc" }, { seqNo: "asc" }],
  });
  for (const q of quotes) {
    quoteSheet.addRow([
      q.quoteDate,
      q.seqNo,
      q.product.name,
      q.unit,
      q.shuangfuPrice,
      q.alliancePrice,
      q.memberPrice,
      q.spec,
      q.remark,
      q.adjustNote,
    ]);
  }

  const salesSheet = wb.addWorksheet("联盟销售统计");
  salesSheet.addRow(["重庆集采联盟销售配送表"]);
  salesSheet.addRow([
    `交易主体：${COMPANY_INFO.name}  ${COMPANY_INFO.bank}  账号:${COMPANY_INFO.account}`,
  ]);
  salesSheet.addRow([
    "序号",
    "配送日期",
    "发货票据编号",
    "客户名称",
    "交易场所",
    "报价单商品名",
    "单位",
    "数量",
    "开单价",
    "标准价",
    "开单金额",
    "抹零价/实收",
    "退货数量",
    "退货金额",
    "最终数量",
    "结算金额",
    "退货原因",
    "退货票据编号",
    "付款状态",
    "未收款金额",
    "不含框未收款金额",
    "备注",
    "商品名",
  ]);

  const sales = await prisma.salesLine.findMany({
    include: {
      customer: true,
      venue: true,
      product: true,
      paymentStatus: true,
    },
    orderBy: [{ deliveryDate: "asc" }, { lineNo: "asc" }],
  });

  for (const s of sales) {
    salesSheet.addRow([
      s.lineNo,
      s.deliveryDate,
      s.invoiceNo || null,
      s.customer.name,
      s.venue.code,
      s.quoteProductName,
      s.unit,
      s.quantity,
      s.unitPrice,
      s.standardPrice,
      s.orderAmount,
      s.actualPrice,
      s.returnQty,
      s.returnAmount,
      s.finalQty,
      s.settlementAmount,
      s.returnReason,
      s.returnInvoiceNo,
      s.paymentStatus.name,
      s.unpaidAmount,
      s.unpaidExDeposit,
      s.remark,
      s.product.name,
    ]);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportReportSheet(
  title: string,
  headers: string[],
  rows: (string | number | null)[][],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title);
  ws.addRow(headers);
  for (const row of rows) ws.addRow(row);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
