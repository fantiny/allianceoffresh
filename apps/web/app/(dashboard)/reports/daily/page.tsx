import { getDailySales } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";
import { DailyTrendChart } from "@/components/charts";
import { formatCurrency } from "@/lib/utils";

export default async function DailyReportPage({
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
  const data = await getDailySales(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">销售日报</h1>
        <ExportButton reportType="daily" searchParams={qs} />
      </div>
      <ReportFilters />
      <Card className="mb-6">
        <CardTitle>日销售趋势</CardTitle>
        <div className="mt-4">
          <DailyTrendChart
            data={data.map((d) => ({ date: d.date, settlement: d.settlementAmount }))}
          />
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">日期</th>
                <th className="pb-3 pr-4">开单金额</th>
                <th className="pb-3 pr-4">结算金额</th>
                <th className="pb-3 pr-4">退货金额</th>
                <th className="pb-3 pr-4">数量</th>
                <th className="pb-3">笔数</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{row.date}</td>
                  <td className="py-3 pr-4">{formatCurrency(row.orderAmount)}</td>
                  <td className="py-3 pr-4 font-medium text-brand">
                    {formatCurrency(row.settlementAmount)}
                  </td>
                  <td className="py-3 pr-4">{formatCurrency(row.returnAmount)}</td>
                  <td className="py-3 pr-4">{row.quantity.toFixed(1)}</td>
                  <td className="py-3">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
