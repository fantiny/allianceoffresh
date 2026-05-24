import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const exports = [
  { type: "full", label: "全库备份", desc: "导出完整 Excel（含销售、报价、别称）" },
  { type: "overview", label: "经营总览", href: "/api/export?type=overview" },
  { type: "daily", label: "销售日报", href: "/api/export?type=daily" },
  { type: "customers", label: "客户分析", href: "/api/export?type=customers" },
  { type: "products", label: "商品分析", href: "/api/export?type=products" },
  { type: "venues", label: "场所分析", href: "/api/export?type=venues" },
  { type: "payments", label: "收款分析", href: "/api/export?type=payments" },
  { type: "prices", label: "报价对比", href: "/api/export?type=prices" },
  { type: "inventory", label: "进销存简表", href: "/api/export?type=inventory" },
];

export default function ExportPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">数据导出</h1>
      <p className="mb-6 text-sm text-slate-500">
        将数据库内容或报表结果导出为 Excel 文件。
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exports.map((item) => (
          <Card key={item.type}>
            <CardTitle>{item.label}</CardTitle>
            {item.desc && (
              <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
            )}
            <Link
              href={item.href ?? `/api/export?type=${item.type}`}
              className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
            >
              下载 Excel
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
