"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";

type Movement = {
  id: string;
  moveDate: string;
  type: string;
  quantity: number;
  remark: string | null;
  product: { name: string };
};

const typeLabels: Record<string, string> = {
  purchase_in: "采购入库",
  sale_out: "销售出库",
  return_in: "退货入库",
  adjust: "手工调整",
};

export default function InventoryPage() {
  const [items, setItems] = useState<Movement[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    moveDate: new Date().toISOString().slice(0, 10),
    productId: "",
    type: "adjust",
    quantity: "",
    remark: "",
  });

  useEffect(() => {
    fetch("/api/inventory-movements")
      .then((r) => r.json())
      .then(setItems);
    fetch("/api/master")
      .then((r) => r.json())
      .then((d) => setProducts(d.products));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/inventory-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setForm({ ...form, quantity: "", remark: "" });
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">库存流水</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>录入库存调整</CardTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.moveDate}
              onChange={(e) => setForm({ ...form, moveDate: e.target.value })}
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
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="数量（出库为负）"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
            <input
              placeholder="备注"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-brand py-2 text-sm text-white"
            >
              保存
            </button>
          </form>
        </Card>
        <Card>
          <CardTitle>最近流水</CardTitle>
          <ul className="mt-4 max-h-[480px] space-y-2 overflow-auto">
            {items.map((m) => (
              <li
                key={m.id}
                className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span>
                  {new Date(m.moveDate).toLocaleDateString("zh-CN")}{" "}
                  {m.product.name}
                </span>
                <span className="text-slate-500">
                  {typeLabels[m.type] ?? m.type}{" "}
                  <strong
                    className={
                      m.quantity >= 0 ? "text-brand" : "text-red-500"
                    }
                  >
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
