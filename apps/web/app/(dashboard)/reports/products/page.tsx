import { getProductReport } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";
import { BarRankChart } from "@/components/charts";
import { formatCurrency } from "@/lib/utils";

export default async function ProductsReportPage({
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
  const data = await getProductReport(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品分析</h1>
        <ExportButton reportType="products" searchParams={qs} />
      </div>
      <ReportFilters showExcludeDeposit />
      <Card className="mb-6">
        <CardTitle>商品结算排行</CardTitle>
        <div className="mt-4">
          <BarRankChart
            data={data
              .filter((d) => !d.isDeposit)
              .map((d) => ({
                productName: d.productName,
                settlementAmount: d.settlementAmount,
              }))}
            dataKey="settlementAmount"
            nameKey="productName"
            label="结算金额"
          />
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">商品</th>
              <th className="pb-3">销量</th>
              <th className="pb-3">结算金额</th>
              <th className="pb-3">退货量</th>
              <th className="pb-3">退货额</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.productId} className="border-b border-slate-100">
                <td className="py-3 font-medium">
                  {row.productName}
                  {row.isDeposit && (
                    <span className="ml-2 text-xs text-slate-400">押金</span>
                  )}
                </td>
                <td className="py-3">{row.finalQty.toFixed(1)}</td>
                <td className="py-3">{formatCurrency(row.settlementAmount)}</td>
                <td className="py-3">{row.returnQty.toFixed(1)}</td>
                <td className="py-3">{formatCurrency(row.returnAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
