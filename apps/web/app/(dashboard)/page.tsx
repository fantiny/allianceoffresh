import { Suspense } from "react";
import { getOverview } from "@repo/database/src/reports";
import { KpiCards } from "@/components/kpi-cards";
import { Card, CardTitle } from "@/components/ui/card";
import { DailyTrendChart, PaymentPieChart } from "@/components/charts";
import { ReportFilters } from "@/components/report-filters";
import { ExportButton } from "@/components/export-button";

async function OverviewContent({
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
  const data = await getOverview(filters);
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">经营总览</h1>
          <p className="mt-1 text-sm text-slate-500">
            重庆集采联盟生鲜销售核心指标
          </p>
        </div>
        <ExportButton reportType="overview" searchParams={qs} />
      </div>
      <Suspense fallback={null}>
        <ReportFilters showExcludeDeposit />
      </Suspense>
      <div className="space-y-6">
        <KpiCards kpis={data.kpis} />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardTitle>日结算金额趋势</CardTitle>
            <div className="mt-4">
              <DailyTrendChart data={data.dailyTrend} />
            </div>
          </Card>
          <Card>
            <CardTitle>付款状态分布</CardTitle>
            <div className="mt-4">
              <PaymentPieChart data={data.paymentBreakdown} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">加载中...</div>}>
      <OverviewContent searchParams={searchParams} />
    </Suspense>
  );
}
