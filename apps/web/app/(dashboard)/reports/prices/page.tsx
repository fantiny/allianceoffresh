import { getPriceQuoteReport } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";
import { PriceLineChart } from "@/components/charts";

export default async function PricesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    from: sp.from,
    to: sp.to,
    productId: sp.productId,
    excludeDeposit: false,
  };
  const data = await getPriceQuoteReport(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">报价对比</h1>
        <ExportButton reportType="prices" searchParams={qs} />
      </div>
      <ReportFilters />
      <Card className="mb-6">
        <CardTitle>三价趋势（按所选商品）</CardTitle>
        <div className="mt-4">
          <PriceLineChart data={data} />
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">日期</th>
              <th className="pb-3">商品</th>
              <th className="pb-3">双福价</th>
              <th className="pb-3">集采价</th>
              <th className="pb-3">会员价</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 100).map((row, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2">{row.date}</td>
                <td className="py-2">{row.product}</td>
                <td className="py-2">{row.shuangfu ?? "-"}</td>
                <td className="py-2">{row.alliance ?? "-"}</td>
                <td className="py-2">{row.member ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
