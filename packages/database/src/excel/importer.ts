import { createHash } from "crypto";
import { prisma } from "../index";
import type { ParsedWorkbook } from "./parser";

export type ImportMode = "replace" | "append";

export type ImportResult = {
  batchId: string;
  stats: {
    sales: number;
    quotes: number;
    aliases: number;
    inventory: number;
  };
  warnings: string[];
};

async function upsertCustomer(name: string) {
  return prisma.customer.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function upsertVenue(code: string) {
  return prisma.venue.upsert({
    where: { code },
    create: { code },
    update: {},
  });
}

async function upsertPaymentStatus(name: string) {
  return prisma.paymentStatus.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function upsertProduct(name: string, unit: string) {
  const isDeposit = name.includes("框子押金") || name.includes("押金");
  return prisma.product.upsert({
    where: { name },
    create: { name, unit, isDeposit },
    update: { unit, isDeposit },
  });
}

const aliasCache = new Map<string, string>();

async function resolveProductId(
  productName: string,
  quoteName: string,
  unit: string,
): Promise<string> {
  const aliasKey = quoteName || productName;
  if (aliasCache.has(aliasKey)) {
    const cachedName = aliasCache.get(aliasKey)!;
    const p = await prisma.product.findUnique({ where: { name: cachedName } });
    if (p) return p.id;
  }

  const alias = await prisma.productAlias.findUnique({
    where: { alias: aliasKey },
    include: { product: true },
  });
  if (alias) {
    aliasCache.set(aliasKey, alias.product.name);
    return alias.productId;
  }

  const product = await upsertProduct(productName, unit);
  aliasCache.set(aliasKey, product.name);
  return product.id;
}

export async function importWorkbook(
  data: ParsedWorkbook,
  options: {
    filename: string;
    buffer: Buffer;
    mode: ImportMode;
    autoInventory?: boolean;
  },
): Promise<ImportResult> {
  const warnings = [...data.warnings];
  const fileHash = createHash("sha256").update(options.buffer).digest("hex");

  if (options.mode === "replace") {
    await prisma.inventoryMovement.deleteMany();
    await prisma.salesLine.deleteMany();
    await prisma.priceQuote.deleteMany();
  }

  for (const name of data.paymentStatuses) {
    await upsertPaymentStatus(name);
  }

  for (const a of data.aliases) {
    const product = await upsertProduct(a.productName, "斤");
    await prisma.productAlias.upsert({
      where: { alias: a.alias },
      create: { alias: a.alias, productId: product.id },
      update: { productId: product.id },
    });
    aliasCache.set(a.alias, a.productName);
  }

  let quoteCount = 0;
  for (const q of data.quotes) {
    const product = await upsertProduct(q.productName, q.unit);
    const seqNo = q.seqNo ?? "";
    await prisma.priceQuote.upsert({
      where: {
        quoteDate_productId_seqNo: {
          quoteDate: q.quoteDate,
          productId: product.id,
          seqNo,
        },
      },
      create: {
        quoteDate: q.quoteDate,
        seqNo,
        productId: product.id,
        unit: q.unit,
        shuangfuPrice: q.shuangfuPrice,
        alliancePrice: q.alliancePrice,
        memberPrice: q.memberPrice,
        spec: q.spec,
        remark: q.remark,
        adjustNote: q.adjustNote,
      },
      update: {
        unit: q.unit,
        shuangfuPrice: q.shuangfuPrice,
        alliancePrice: q.alliancePrice,
        memberPrice: q.memberPrice,
        spec: q.spec,
        remark: q.remark,
        adjustNote: q.adjustNote,
      },
    });
    quoteCount++;
  }

  aliasCache.clear();
  let salesCount = 0;
  let inventoryCount = 0;
  const autoInventory = options.autoInventory ?? true;

  for (const row of data.sales) {
    const customer = await upsertCustomer(row.customerName);
    const venue = await upsertVenue(row.venueCode);
    const payment = await upsertPaymentStatus(row.paymentStatus);
    const productId = await resolveProductId(
      row.productName,
      row.quoteProductName,
      row.unit,
    );

    const invoiceKey = row.invoiceNo ?? "";

    await prisma.salesLine.upsert({
      where: {
        deliveryDate_invoiceNo_customerId_productId_lineNo: {
          deliveryDate: row.deliveryDate,
          invoiceNo: invoiceKey,
          customerId: customer.id,
          productId,
          lineNo: row.lineNo,
        },
      },
      create: {
        lineNo: row.lineNo,
        deliveryDate: row.deliveryDate,
        invoiceNo: invoiceKey,
        customerId: customer.id,
        venueId: venue.id,
        productId,
        quoteProductName: row.quoteProductName,
        unit: row.unit,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        standardPrice: row.standardPrice,
        orderAmount: row.orderAmount,
        actualPrice: row.actualPrice,
        returnQty: row.returnQty,
        returnAmount: row.returnAmount,
        finalQty: row.finalQty,
        settlementAmount: row.settlementAmount,
        returnReason: row.returnReason,
        returnInvoiceNo: row.returnInvoiceNo,
        paymentStatusId: payment.id,
        unpaidAmount: row.unpaidAmount,
        unpaidExDeposit: row.unpaidExDeposit,
        remark: row.remark,
      },
      update: {
        venueId: venue.id,
        quoteProductName: row.quoteProductName,
        unit: row.unit,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        standardPrice: row.standardPrice,
        orderAmount: row.orderAmount,
        actualPrice: row.actualPrice,
        returnQty: row.returnQty,
        returnAmount: row.returnAmount,
        finalQty: row.finalQty,
        settlementAmount: row.settlementAmount,
        returnReason: row.returnReason,
        returnInvoiceNo: row.returnInvoiceNo,
        paymentStatusId: payment.id,
        unpaidAmount: row.unpaidAmount,
        unpaidExDeposit: row.unpaidExDeposit,
        remark: row.remark,
      },
    });
    salesCount++;

    if (autoInventory && row.finalQty > 0) {
      await prisma.inventoryMovement.create({
        data: {
          moveDate: row.deliveryDate,
          productId,
          type: "sale_out",
          quantity: -row.finalQty,
          remark: `销售 ${row.customerName}`,
          refId: invoiceKey || String(row.lineNo),
        },
      });
      inventoryCount++;
      if (row.returnQty > 0) {
        await prisma.inventoryMovement.create({
          data: {
            moveDate: row.deliveryDate,
            productId,
            type: "return_in",
            quantity: row.returnQty,
            remark: `退货 ${row.customerName}`,
            refId: invoiceKey || String(row.lineNo),
          },
        });
        inventoryCount++;
      }
    }
  }

  const batch = await prisma.importBatch.create({
    data: {
      filename: options.filename,
      fileHash,
      mode: options.mode,
      stats: JSON.stringify({
        sales: salesCount,
        quotes: quoteCount,
        aliases: data.aliases.length,
        inventory: inventoryCount,
      }),
      warnings: warnings.length ? JSON.stringify(warnings) : null,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "company_name" },
    create: { key: "company_name", value: "重庆迅马水产品销售有限公司" },
    update: {},
  });

  return {
    batchId: batch.id,
    stats: {
      sales: salesCount,
      quotes: quoteCount,
      aliases: data.aliases.length,
      inventory: inventoryCount,
    },
    warnings,
  };
}
