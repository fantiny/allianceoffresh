import { z } from "zod";

export const reportFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  customerId: z.string().optional(),
  productId: z.string().optional(),
  venueId: z.string().optional(),
  paymentStatusId: z.string().optional(),
  excludeDeposit: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

export const COMPANY_INFO = {
  name: "重庆迅马水产品销售有限公司",
  bank: "中国工商银行两江新区鸳鸯支行",
  account: "3100032319100271934",
  brand: "重庆集采联盟",
} as const;

export const INVENTORY_TYPES = [
  "purchase_in",
  "sale_out",
  "return_in",
  "adjust",
] as const;

export type InventoryType = (typeof INVENTORY_TYPES)[number];

export function parseReportFilters(
  searchParams: URLSearchParams,
): ReportFilters {
  return reportFiltersSchema.parse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
    productId: searchParams.get("productId") ?? undefined,
    venueId: searchParams.get("venueId") ?? undefined,
    paymentStatusId: searchParams.get("paymentStatusId") ?? undefined,
    excludeDeposit: searchParams.get("excludeDeposit") ?? undefined,
  });
}

export function buildSalesWhere(filters: ReportFilters) {
  const where: Record<string, unknown> = {};
  if (filters.from || filters.to) {
    where.deliveryDate = {};
    if (filters.from)
      (where.deliveryDate as Record<string, Date>).gte = new Date(filters.from);
    if (filters.to)
      (where.deliveryDate as Record<string, Date>).lte = new Date(
        `${filters.to}T23:59:59`,
      );
  }
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.venueId) where.venueId = filters.venueId;
  if (filters.paymentStatusId) where.paymentStatusId = filters.paymentStatusId;
  if (filters.excludeDeposit) {
    where.product = { isDeposit: false };
  }
  return where;
}
