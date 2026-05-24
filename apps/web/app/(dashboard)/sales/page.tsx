"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type SaleLine = {
  id: string;
  deliveryDate: string;
  customer: { name: string };
  product: { name: string };
  venue: { code: string };
  settlementAmount: number;
  unpaidAmount: number;
  paymentStatus: { name: string };
};

export default function SalesPage() {
  const [items, setItems] = useState<SaleLine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/sales-lines?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      });
  }, [page]);

  async function handleDelete(id: string) {
    if (!confirm("确定删除该明细？")) return;
    await fetch("/api/sales-lines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">销售明细</h1>
      <Card>
        <p className="mb-4 text-sm text-slate-500">共 {total} 条记录</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3">日期</th>
              <th className="pb-3">客户</th>
              <th className="pb-3">商品</th>
              <th className="pb-3">场所</th>
              <th className="pb-3">结算</th>
              <th className="pb-3">未收</th>
              <th className="pb-3">状态</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-2">
                  {new Date(row.deliveryDate).toLocaleDateString("zh-CN")}
                </td>
                <td className="py-2">{row.customer.name}</td>
                <td className="py-2">{row.product.name}</td>
                <td className="py-2">{row.venue.code}</td>
                <td className="py-2">{formatCurrency(row.settlementAmount)}</td>
                <td className="py-2">{formatCurrency(row.unpaidAmount)}</td>
                <td className="py-2">{row.paymentStatus.name}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <button
            disabled={page * 50 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </Card>
    </>
  );
}
