import { Card } from "./ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";

type Kpis = {
  orderAmount: number;
  settlementAmount: number;
  unpaidAmount: number;
  returnAmount: number;
  unpaidRate: number;
  returnRate: number;
  lineCount: number;
};

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const items = [
    { label: "开单金额", value: formatCurrency(kpis.orderAmount), sub: `${kpis.lineCount} 笔` },
    { label: "结算金额", value: formatCurrency(kpis.settlementAmount), sub: "实收合计" },
    { label: "未收款", value: formatCurrency(kpis.unpaidAmount), sub: `未结款率 ${formatPercent(kpis.unpaidRate)}` },
    { label: "退货金额", value: formatCurrency(kpis.returnAmount), sub: `退货率 ${formatPercent(kpis.returnRate)}` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-brand to-emerald-300" />
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
          <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
        </Card>
      ))}
    </div>
  );
}
