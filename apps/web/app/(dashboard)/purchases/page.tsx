"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Product = { id: string; name: string };
type PurchaseOrder = {
  id: string;
  orderDate: string;
  supplier: string;
  lines: { product: { name: string }; quantity: number; amount: number }[];
};

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    orderDate: new Date().toISOString().slice(0, 10),
    supplier: "",
    productId: "",
    quantity: "",
    unitPrice: "",
  });

  useEffect(() => {
    fetch("/api/purchases")
      .then((r) => r.json())
      .then(setOrders);
    fetch("/api/master")
      .then((r) => r.json())
      .then((d) => setProducts(d.products));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderDate: form.orderDate,
        supplier: form.supplier,
        lines: [
          {
            productId: form.productId,
            quantity: Number(form.quantity),
            unitPrice: Number(form.unitPrice),
          },
        ],
      }),
    });
    if (res.ok) {
      const order = await res.json();
      setOrders((prev) => [order, ...prev]);
      setForm({ ...form, supplier: "", quantity: "", unitPrice: "" });
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">采购管理</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>新建采购单</CardTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
              required
            />
            <input
              placeholder="供应商"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              required
            />
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            >
              <option value="">选择商品</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="数量"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="单价"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand py-2 text-sm text-white"
            >
              保存采购单
            </button>
          </form>
        </Card>
        <Card>
          <CardTitle>采购记录</CardTitle>
          <ul className="mt-4 space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-slate-100 p-3 text-sm"
              >
                <p className="font-medium">
                  {new Date(o.orderDate).toLocaleDateString("zh-CN")} ·{" "}
                  {o.supplier}
                </p>
                {o.lines.map((l, i) => (
                  <p key={i} className="text-slate-600">
                    {l.product.name} × {l.quantity} ={" "}
                    {formatCurrency(l.amount)}
                  </p>
                ))}
              </li>
            ))}
            {orders.length === 0 && (
              <p className="text-slate-400">暂无采购记录</p>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
