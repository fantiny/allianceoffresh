import { getVenueReport } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";
import { VenueBarChart } from "@/components/charts";
import { formatCurrency } from "@/lib/utils";

export default async function VenuesReportPage({
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
  const data = await getVenueReport(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">场所分析</h1>
        <ExportButton reportType="venues" searchParams={qs} />
      </div>
      <ReportFilters />
      <Card className="mb-6">
        <CardTitle>交易场所对比</CardTitle>
        <div className="mt-4">
          <VenueBarChart data={data} />
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">场所</th>
              <th className="pb-3">结算金额</th>
              <th className="pb-3">开单金额</th>
              <th className="pb-3">笔数</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.venueId} className="border-b border-slate-100">
                <td className="py-3 font-medium">{row.venueCode}</td>
                <td className="py-3 text-brand">{formatCurrency(row.settlementAmount)}</td>
                <td className="py-3">{formatCurrency(row.orderAmount)}</td>
                <td className="py-3">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
