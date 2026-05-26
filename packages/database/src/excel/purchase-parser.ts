import ExcelJS from "exceljs";
import { cellDate, cellNum, cellStr } from "./cell-utils";

export type ParsedPurchaseRow = {
  purchaseDate: Date;
  supplier: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  deposit: number;
  freight: number;
  payment: number;
  remark: string | null;
};

export type ParsedPurchaseWorkbook = {
  rows: ParsedPurchaseRow[];
  warnings: string[];
};

function isSubtotalRow(name: string): boolean {
  return /^(合计|小计|总计|汇总)/.test(name.trim());
}

function toLoadable(buffer: Buffer | ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer);
}

/**
 * Parse a 进货明细账 Excel file.
 *
 * Expected column layout (1-indexed):
 *   1=日期  2=供货单位  3=名称及规格  4=单位  5=数量
 *   6=单价  7=金额  8=框子押金  9=合计  10=运费  11=合计2  12=付款  13=备注
 *
 * Rows where date/supplier are blank inherit the values from the previous row.
 * Rows whose product name looks like a subtotal are skipped.
 */
export async function parsePurchaseWorkbookBuffer(
  buffer: Buffer | ArrayBuffer,
): Promise<ParsedPurchaseWorkbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(toLoadable(buffer) as unknown as ExcelJS.Buffer);

  const rows: ParsedPurchaseRow[] = [];
  const warnings: string[] = [];

  let lastDate: Date | null = null;
  let lastSupplier: string = "";

  for (const sheet of wb.worksheets) {
    // Skip helper sheets
    const name = sheet.name.trim();
    if (name === "搬运" || name === "Sheet1") continue;

    let skippedHeader = false;

    sheet.eachRow((row, rowNum) => {
      // Skip the very first row (header) per sheet
      if (!skippedHeader) {
        skippedHeader = true;
        return;
      }

      const rawDate = row.getCell(1).value;
      const rawSupplier = row.getCell(2).value;
      const rawProduct = row.getCell(3).value;

      const dateVal = cellDate(rawDate);
      const supplierVal = cellStr(rawSupplier);
      const productVal = cellStr(rawProduct);

      // Update running date/supplier if present
      if (dateVal) lastDate = dateVal;
      if (supplierVal) lastSupplier = supplierVal;

      // Skip rows with no product name
      if (!productVal) return;

      // Skip subtotal / summary rows
      if (isSubtotalRow(productVal)) return;

      if (!lastDate) {
        warnings.push(`行 ${rowNum}(${name}): 无法确定日期，已跳过`);
        return;
      }
      if (!lastSupplier) {
        warnings.push(`行 ${rowNum}(${name}): 无法确定供货单位，已跳过`);
        return;
      }

      rows.push({
        purchaseDate: lastDate,
        supplier: lastSupplier,
        productName: productVal,
        unit: cellStr(row.getCell(4).value) ?? "斤",
        quantity: cellNum(row.getCell(5).value),
        unitPrice: cellNum(row.getCell(6).value),
        amount: cellNum(row.getCell(7).value),
        deposit: cellNum(row.getCell(8).value),
        freight: cellNum(row.getCell(10).value),
        payment: cellNum(row.getCell(12).value),
        remark: cellStr(row.getCell(13).value),
      });
    });

    // Reset running values between sheets
    lastDate = null;
    lastSupplier = "";
  }

  return { rows, warnings };
}
