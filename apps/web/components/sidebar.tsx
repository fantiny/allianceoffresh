"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Package,
  Upload,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  Users,
  MapPin,
  CreditCard,
  TrendingUp,
  LayoutDashboard,
  Tags,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_INFO } from "@repo/shared";

const nav = [
  { href: "/", label: "经营总览", icon: LayoutDashboard },
  { href: "/reports/daily", label: "销售日报", icon: TrendingUp },
  { href: "/reports/customers", label: "客户分析", icon: Users },
  { href: "/reports/products", label: "商品分析", icon: Package },
  { href: "/reports/venues", label: "场所分析", icon: MapPin },
  { href: "/reports/payments", label: "收款分析", icon: CreditCard },
  { href: "/reports/prices", label: "报价对比", icon: BarChart3 },
  { href: "/reports/inventory", label: "进销存简表", icon: Warehouse },
  { href: "/sales", label: "销售明细", icon: ShoppingCart },
  { href: "/purchases", label: "采购管理", icon: Package },
  { href: "/products", label: "商品名称管理", icon: Tags },
  { href: "/customers", label: "客户名称管理", icon: UserCog },
  { href: "/inventory", label: "库存流水", icon: Warehouse },
  { href: "/import", label: "数据导入", icon: Upload },
  { href: "/export", label: "数据导出", icon: FileSpreadsheet },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-slate-700 px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold">
            鲜
          </div>
          <div>
            <p className="font-semibold text-white">{COMPANY_INFO.brand}</p>
            <p className="text-xs text-slate-400">销售数据报表系统</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700 p-4 text-xs text-slate-500">
        {COMPANY_INFO.name}
      </div>
    </aside>
  );
}
