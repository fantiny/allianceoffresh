"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = { id: string; name: string };
type Customer = { id: string; name: string };

type SalesLine = {
  id: string;
  lineNo: number;
  deliveryDate: string;
  invoiceNo: string | null;
  customer: { name: string };
  product: { name: string; groupName: string | null };
  venue: { code: string };
  quantity: number;
  unitPrice: number;
  settlementAmount: number;
  unpaidAmount: number;
  unpaidExDeposit: number;
  paymentStatus: { id: string; name: string };
  remark: string | null;
};

type Summary = { settlementAmount: number; unpaidAmount: number };

function productDisplay(p: { name: string; groupName: string | null }) {
  return p.groupName?.trim() || p.name;
}

// ── Inline payment edit row ───────────────────────────────────────────────────

function PaymentEditRow({
  row,
  paymentStatuses,
  password,
  onSaved,
  onCancel,
}: {
  row: SalesLine;
  paymentStatuses: PaymentStatus[];
  password: string;
  onSaved: (updated: SalesLine) => void;
  onCancel: () => void;
}) {
  const [statusId, setStatusId] = useState(row.paymentStatus.id);
  const [unpaid, setUnpaid] = useState(String(row.unpaidAmount));
  const [unpaidEx, setUnpaidEx] = useState(String(row.unpaidExDeposit));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (password) headers["authorization"] = `Bearer ${password}`;
      const res = await fetch("/api/sales-lines", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: row.id,
          paymentStatusId: statusId,
          unpaidAmount: parseFloat(unpaid) || 0,
          unpaidExDeposit: parseFloat(unpaidEx) || 0,
        }),
      });
      if (res.ok) {
        onSaved(await res.json());
      } else {
        const d = await res.json();
        setErr(d.error ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  function setFullyPaid() {
    const s = paymentStatuses.find((s) => s.name === "已付款");
    if (s) setStatusId(s.id);
    setUnpaid("0");
    setUnpaidEx("0");
  }

  return (
    <tr className="bg-brand/5 border-b border-brand/20">
      <td colSpan={8} className="px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">付款状态</label>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
            >
              {paymentStatuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">未收款金额</label>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0"
              value={unpaid}
              onChange={(e) => setUnpaid(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
              className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">不含框未收款</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unpaidEx}
              onChange={(e) => setUnpaidEx(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
              className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={setFullyPaid}
              className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              全额收款
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "保存中…" : "保存"}
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              取消
            </button>
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [items, setItems] = useState<SalesLine[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({ settlementAmount: 0, unpaidAmount: 0 });
  const [page, setPage] = useState(1);

  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "paid" | "unpaid">("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setPassword(localStorage.getItem("admin_pw") ?? "");
  }, []);

  useEffect(() => {
    fetch("/api/master").then((r) => r.json()).then((d) => {
      setPaymentStatuses(d.paymentStatuses);
      setCustomers(d.customers);
    });
  }, []);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams({ page: String(page) });
    if (customerFilter) p.set("customerId", customerFilter);
    if (dateFrom) p.set("from", dateFrom);
    if (dateTo) p.set("to", dateTo);
    if (statusFilter) {
      const name = statusFilter === "paid" ? "已付款" : "未付款";
      const s = paymentStatuses.find((ps) => ps.name === name);
      if (s) p.set("paymentStatusId", s.id);
    }
    return p.toString();
  }, [page, customerFilter, dateFrom, dateTo, statusFilter, paymentStatuses]);

  const load = useCallback(() => {
    fetch(`/api/sales-lines?${buildQuery()}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setSummary(d.summary ?? { settlementAmount: 0, unpaidAmount: 0 });
      });
  }, [buildQuery]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [customerFilter, dateFrom, dateTo, statusFilter]);

  function handleSaved(updated: SalesLine) {
    setItems((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setSummary((prev) => {
      const old = items.find((r) => r.id === updated.id);
      if (!old) return prev;
      return {
        settlementAmount: prev.settlementAmount,
        unpaidAmount: prev.unpaidAmount - old.unpaidAmount + updated.unpaidAmount,
      };
    });
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该明细？")) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (password) headers["authorization"] = `Bearer ${password}`;
    await fetch("/api/sales-lines", { method: "DELETE", headers, body: JSON.stringify({ id }) });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  }

  const pageCount = Math.ceil(total / 50);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">销售明细</h1>

      {/* Password */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs text-slate-500 shrink-0">管理密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            localStorage.setItem("admin_pw", e.target.value);
          }}
          placeholder="用于收款更新"
          className="w-44 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {/* Filter bar */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="">全部客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
            <span className="text-slate-400 text-xs">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex gap-1">
            {([["", "全部"], ["unpaid", "未收款"], ["paid", "已收款"]] as const).map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
          {(customerFilter || dateFrom || dateTo || statusFilter) && (
            <button
              onClick={() => { setCustomerFilter(""); setDateFrom(""); setDateTo(""); setStatusFilter(""); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              清除
            </button>
          )}
        </div>
      </Card>

      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm">
        <span className="text-slate-500">
          共 <strong className="text-slate-800">{total}</strong> 条
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">
          结算 <strong className="text-slate-800">{formatCurrency(summary.settlementAmount)}</strong>
        </span>
        <span className="text-slate-300">|</span>
        <span className={summary.unpaidAmount > 0 ? "font-medium text-red-500" : "text-slate-500"}>
          未收款 <strong>{formatCurrency(summary.unpaidAmount)}</strong>
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-3 font-medium">日期</th>
              <th className="px-3 py-3 font-medium">客户</th>
              <th className="px-3 py-3 font-medium">商品</th>
              <th className="px-3 py-3 font-medium">场所</th>
              <th className="px-3 py-3 font-medium text-right">结算</th>
              <th className="px-3 py-3 font-medium text-right">未收款</th>
              <th className="px-3 py-3 font-medium">状态</th>
              <th className="px-3 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">暂无数据</td>
              </tr>
            )}
            {items.map((row) => (
              <>
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 transition-colors ${
                    editingId === row.id ? "bg-brand/5" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-3 py-2.5 text-slate-600 tabular-nums">
                    {new Date(row.deliveryDate).toLocaleDateString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {row.customer.name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {productDisplay(row.product)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{row.venue.code}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatCurrency(row.settlementAmount)}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${
                    row.unpaidAmount > 0 ? "text-red-500" : "text-slate-300"
                  }`}>
                    {row.unpaidAmount > 0 ? formatCurrency(row.unpaidAmount) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.paymentStatus.name === "已付款"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {row.paymentStatus.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(editingId === row.id ? null : row.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"
                      >
                        {editingId === row.id ? "收起" : "收款"}
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-xs text-slate-300 hover:text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === row.id && (
                  <PaymentEditRow
                    key={`edit-${row.id}`}
                    row={row}
                    paymentStatuses={paymentStatuses}
                    password={password}
                    onSaved={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </>
            ))}
          </tbody>
        </table>

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-400">
              第 {page} / {pageCount} 页，共 {total} 条
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> 上一页
              </button>
              <button
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                下一页 <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
