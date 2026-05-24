import ExcelJS from "exceljs";
import { cellDate, cellNum, cellStr, cellValue } from "./cell-utils";

export type ParsedSalesRow = {
  lineNo: number;
  deliveryDate: Date;
  invoiceNo: string | null;
  customerName: string;
  venueCode: string;
  quoteProductName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  standardPrice: number;
  orderAmount: number;
  actualPrice: number | null;
  returnQty: number;
  returnAmount: number;
  finalQty: number;
  settlementAmount: number;
  returnReason: string | null;
  returnInvoiceNo: string | null;
  paymentStatus: string;
  unpaidAmount: number;
  unpaidExDeposit: number;
  remark: string | null;
  productName: string;
};

export type ParsedAlias = { alias: string; productName: string };
export type ParsedQuote = {
  quoteDate: Date;
  seqNo: string | null;
  productName: string;
  unit: string;
  shuangfuPrice: number | null;
  alliancePrice: number | null;
  memberPrice: number | null;
  spec: string | null;
  remark: string | null;
  adjustNote: string | null;
};

export type ParsedWorkbook = {
  paymentStatuses: string[];
  sales: ParsedSalesRow[];
  aliases: ParsedAlias[];
  quotes: ParsedQuote[];
  warnings: string[];
};

function normalizePaymentStatus(raw: string): string {
  if (raw.includes("已付款")) return "已付款";
  if (raw.includes("未付款") || raw.includes("未收款")) return "未付款";
  return "未付款";
}

function parsePrice(v: unknown): number | null {
  const raw = cellValue(v);
  if (raw == null || raw === "" || raw === "-") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function buildHeaderMap(row: ExcelJS.Row): Map<string, number> {
  const map = new Map<string, number>();
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    const name = cellStr(cell.value);
    if (name) map.set(name.replace(/\s/g, ""), col);
  });
  return map;
}

function col(map: Map<string, number>, ...names: string[]): number | undefined {
  for (const n of names) {
    const c = map.get(n.replace(/\s/g, ""));
    if (c != null) return c;
  }
  return undefined;
}

function toLoadable(buffer: Buffer | ArrayBuffer): Uint8Array {
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  return new Uint8Array(buffer);
}

export async function parseWorkbookBuffer(
  buffer: Buffer | ArrayBuffer,
): Promise<ParsedWorkbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(toLoadable(buffer) as unknown as ExcelJS.Buffer);
  const warnings: string[] = [];

  const paymentStatuses: string[] = [];
  const defs = wb.getWorksheet("基础定义表");
  if (defs) {
    defs.eachRow((row, i) => {
      if (i > 1) {
        const v = cellStr(row.getCell(1).value);
        if (v) paymentStatuses.push(v);
      }
    });
  }
  if (!paymentStatuses.length) {
    paymentStatuses.push("未付款", "已付款");
  }

  const aliases: ParsedAlias[] = [];
  const aliasSheet = wb.getWorksheet("商品名别称");
  if (aliasSheet) {
    aliasSheet.eachRow((row, i) => {
      if (i === 1) return;
      const alias = cellStr(row.getCell(1).value);
      const productName = cellStr(row.getCell(2).value);
      if (alias && productName) aliases.push({ alias, productName });
    });
  }

  const quotes: ParsedQuote[] = [];
  const quoteSheet = wb.getWorksheet("报价表");
  if (quoteSheet) {
    quoteSheet.eachRow((row, i) => {
      if (i === 1) return;
      const quoteDate = cellDate(row.getCell(1).value);
      const productName = cellStr(row.getCell(3).value);
      if (!quoteDate || !productName) return;
      const seqVal = cellValue(row.getCell(2).value);
      quotes.push({
        quoteDate,
        seqNo: seqVal != null ? String(seqVal) : null,
        productName,
        unit: cellStr(row.getCell(4).value) ?? "斤",
        shuangfuPrice: parsePrice(row.getCell(5).value),
        alliancePrice: parsePrice(row.getCell(6).value),
        memberPrice: parsePrice(row.getCell(7).value),
        spec: cellStr(row.getCell(8).value),
        remark: cellStr(row.getCell(9).value),
        adjustNote: cellStr(row.getCell(10).value),
      });
    });
  }

  const sales: ParsedSalesRow[] = [];
  const salesSheet = wb.getWorksheet("联盟销售统计");
  if (salesSheet) {
    let headerMap: Map<string, number> | null = null;

    salesSheet.eachRow((row, i) => {
      if (i === 3) {
        headerMap = buildHeaderMap(row);
        return;
      }
      if (i < 4 || !headerMap) return;

      const get = (key: string, fallback?: number) => {
        const idx = col(headerMap!, key) ?? fallback;
        return idx != null ? row.getCell(idx).value : null;
      };

      const customerName = cellStr(get("客户名称", 4));
      const productName =
        cellStr(get("商品名", 23)) ?? cellStr(get("报价单商品名", 6));
      if (!customerName || !productName) return;

      const deliveryDate = cellDate(get("配送日期", 2));
      if (!deliveryDate) {
        warnings.push(`行 ${i}: 缺少配送日期，已跳过`);
        return;
      }

      const rawPayment = cellStr(get("付款状态", 19)) ?? "未付款";
      const paymentStatus = normalizePaymentStatus(rawPayment);
      if (rawPayment !== paymentStatus && !rawPayment.includes("已付款")) {
        warnings.push(
          `行 ${i}: 付款状态「${rawPayment}」已规范为「${paymentStatus}」`,
        );
      }

      const actualRaw = get("抹零价/实收", 12);
      const actualVal = cellValue(actualRaw);

      sales.push({
        lineNo: cellNum(get("序号", 1)) || i,
        deliveryDate,
        invoiceNo: cellStr(get("发货票据编号", 3)),
        customerName,
        venueCode: cellStr(get("交易场所", 5)) ?? "未知",
        quoteProductName: cellStr(get("报价单商品名", 6)) ?? productName,
        unit: cellStr(get("单位", 7)) ?? "斤",
        quantity: cellNum(get("数量", 8)),
        unitPrice: cellNum(get("开单价", 9)),
        standardPrice: cellNum(get("标准价", 10)),
        orderAmount: cellNum(get("开单金额", 11)),
        actualPrice:
          actualVal != null && actualVal !== "" ? cellNum(actualRaw) : null,
        returnQty: cellNum(get("退货数量", 13)),
        returnAmount: cellNum(get("退货金额", 14)),
        finalQty: cellNum(get("最终数量", 15)),
        settlementAmount: cellNum(get("结算金额", 16)),
        returnReason: cellStr(get("退货原因", 17)),
        returnInvoiceNo: cellStr(get("退货票据编号", 18)),
        paymentStatus,
        unpaidAmount: cellNum(get("未收款金额", 20)),
        unpaidExDeposit: cellNum(get("不含框未收款金额", 21)),
        remark: cellStr(get("备注", 22)),
        productName,
      });
    });
  }

  return { paymentStatuses, sales, aliases, quotes, warnings };
}
