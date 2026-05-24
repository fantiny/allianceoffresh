import { getInventoryReport } from "@repo/database/src/reports";
import { Card, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    from: sp.from,
    to: sp.to,
    productId: sp.productId,
    excludeDeposit: sp.excludeDeposit === "true",
  };
  const data = await getInventoryReport(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">进销存简表</h1>
        <ExportButton reportType="inventory" searchParams={qs} />
      </div>
      <ReportFilters showExcludeDeposit />
      <Card>
        <CardTitle>期初 + 采购 − 销售 + 退货 + 调整 = 期末</CardTitle>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">商品</th>
              <th className="pb-3">采购入库</th>
              <th className="pb-3">销售出库</th>
              <th className="pb-3">退货入库</th>
              <th className="pb-3">调整</th>
              <th className="pb-3">期末估算</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.productId} className="border-b border-slate-100">
                <td className="py-3 font-medium">{row.productName}</td>
                <td className="py-3">{row.purchaseIn.toFixed(1)}</td>
                <td className="py-3">{row.saleOut.toFixed(1)}</td>
                <td className="py-3">{row.returnIn.toFixed(1)}</td>
                <td className="py-3">{row.adjust.toFixed(1)}</td>
                <td className="py-3 font-medium text-brand">
                  {row.closing.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
