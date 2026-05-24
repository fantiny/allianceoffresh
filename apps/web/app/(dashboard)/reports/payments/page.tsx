import { getPaymentReport } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";
import { formatCurrency } from "@/lib/utils";

export default async function PaymentsReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    from: sp.from,
    to: sp.to,
    customerId: sp.customerId,
    productId: sp.productId,
    venueId: sp.venueId,
    paymentStatusId: sp.paymentStatusId,
    excludeDeposit: sp.excludeDeposit === "true",
  };
  const data = await getPaymentReport(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">收款分析</h1>
        <ExportButton reportType="payments" searchParams={qs} />
      </div>
      <ReportFilters />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {data.byStatus.map((s) => (
          <Card key={s.status}>
            <p className="text-sm text-slate-500">{s.status}</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(s.settlement)}</p>
            <p className="text-sm text-amber-600">
              未收 {formatCurrency(s.unpaid)} · {s.count} 笔
            </p>
          </Card>
        ))}
      </div>
      <Card>
        <CardTitle>未收款明细</CardTitle>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">日期</th>
              <th className="pb-3">客户</th>
              <th className="pb-3">商品</th>
              <th className="pb-3">结算</th>
              <th className="pb-3">未收</th>
              <th className="pb-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {data.unpaidLines.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3">{row.date}</td>
                <td className="py-3">{row.customer}</td>
                <td className="py-3">{row.product}</td>
                <td className="py-3">{formatCurrency(row.settlement)}</td>
                <td className="py-3 font-medium text-amber-600">
                  {formatCurrency(row.unpaid)}
                </td>
                <td className="py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
