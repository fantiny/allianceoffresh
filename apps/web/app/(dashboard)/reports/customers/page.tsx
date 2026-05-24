import { getCustomerReport } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";
import { BarRankChart } from "@/components/charts";
import { formatCurrency } from "@/lib/utils";

export default async function CustomersReportPage({
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
  const data = await getCustomerReport(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">客户分析</h1>
        <ExportButton reportType="customers" searchParams={qs} />
      </div>
      <ReportFilters />
      <Card className="mb-6">
        <CardTitle>客户结算排行</CardTitle>
        <div className="mt-4">
          <BarRankChart
            data={data.map((d) => ({
              customerName: d.customerName,
              settlementAmount: d.settlementAmount,
            }))}
            dataKey="settlementAmount"
            nameKey="customerName"
            label="结算金额"
          />
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">客户</th>
              <th className="pb-3">开单金额</th>
              <th className="pb-3">结算金额</th>
              <th className="pb-3">未收款</th>
              <th className="pb-3">退货</th>
              <th className="pb-3">笔数</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.customerId} className="border-b border-slate-100">
                <td className="py-3 font-medium">{row.customerName}</td>
                <td className="py-3">{formatCurrency(row.orderAmount)}</td>
                <td className="py-3 text-brand">{formatCurrency(row.settlementAmount)}</td>
                <td className="py-3 text-amber-600">{formatCurrency(row.unpaidAmount)}</td>
                <td className="py-3">{formatCurrency(row.returnAmount)}</td>
                <td className="py-3">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
