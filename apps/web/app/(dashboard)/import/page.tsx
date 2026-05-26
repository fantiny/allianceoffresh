"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

// ── Sales Import ──────────────────────────────────────────────────────────────

function SalesImportCard({ password }: { password: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{
    stats?: Record<string, number>;
    warnings?: string[];
    error?: string;
  } | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);
    try {
      const headers: Record<string, string> = {};
      if (password) headers["authorization"] = `Bearer ${password}`;
      const res = await fetch("/api/import", {
        method: "POST",
        body: form,
        headers,
      });
      const data = await res.json();
      if (!res.ok) setResult({ error: data.error ?? "导入失败" });
      else setResult({ stats: data.stats, warnings: data.warnings });
    } catch {
      setResult({ error: "网络错误" });
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardTitle>上传销售 Excel（每日交易金额汇总表）</CardTitle>
      <div className="mt-6 space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 transition hover:border-brand hover:bg-brand-light/30">
          <Upload className="mb-2 h-10 w-10 text-slate-400" />
          <span className="text-sm text-slate-600">
            {file ? file.name : "点击选择 .xlsx 文件"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
            覆盖导入
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "append"} onChange={() => setMode("append")} />
            追加导入
          </label>
        </div>
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              导入中… {elapsed}s（大文件最长需 60 秒）
            </span>
          ) : "开始导入"}
        </button>
      </div>
      {result && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
          {result.error && <p className="text-red-600">{result.error}</p>}
          {result.stats && (
            <ul className="space-y-1 text-slate-700">
              <li>销售明细：{result.stats.sales} 条</li>
              <li>报价：{result.stats.quotes} 条</li>
              <li>别称：{result.stats.aliases} 条</li>
              <li>库存流水：{result.stats.inventory} 条</li>
            </ul>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-amber-600">
                {result.warnings.length} 条警告
              </summary>
              <ul className="mt-2 max-h-40 overflow-auto text-xs text-slate-500">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Purchase Import ───────────────────────────────────────────────────────────

function PurchaseImportCard({ password }: { password: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{
    stats?: { orders: number; lines: number; inventory: number; newProducts: number };
    unmapped?: string[];
    warnings?: string[];
    error?: string;
  } | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);
    try {
      const headers: Record<string, string> = {};
      if (password) headers["authorization"] = `Bearer ${password}`;
      const res = await fetch("/api/import/purchases", {
        method: "POST",
        body: form,
        headers,
      });
      const data = await res.json();
      if (!res.ok) setResult({ error: data.error ?? "导入失败" });
      else setResult(data);
    } catch {
      setResult({ error: "网络错误" });
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardTitle>上传进货 Excel（进货明细账）</CardTitle>
      <div className="mt-6 space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 transition hover:border-brand hover:bg-brand-light/30">
          <Upload className="mb-2 h-10 w-10 text-slate-400" />
          <span className="text-sm text-slate-600">
            {file ? file.name : "点击选择 .xlsx 文件"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
            覆盖导入
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "append"} onChange={() => setMode("append")} />
            追加导入
          </label>
        </div>
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              导入中… {elapsed}s
            </span>
          ) : "开始导入"}
        </button>
      </div>
      {result && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
          {result.error && <p className="text-red-600">{result.error}</p>}
          {result.stats && (
            <ul className="space-y-1 text-slate-700">
              <li>采购单：{result.stats.orders} 张</li>
              <li>采购明细：{result.stats.lines} 条</li>
              <li>库存流水：{result.stats.inventory} 条</li>
              {result.stats.newProducts > 0 && (
                <li className="text-amber-600">
                  新增商品（进货名）：{result.stats.newProducts} 个
                  {result.unmapped && result.unmapped.length > 0 && (
                    <span className="ml-1 text-xs text-slate-500">
                      ——请在下方"商品名对照"中设置进销名称对应关系
                    </span>
                  )}
                </li>
              )}
            </ul>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-amber-600">
                {result.warnings.length} 条警告
              </summary>
              <ul className="mt-2 max-h-40 overflow-auto text-xs text-slate-500">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Product Alias Manager ─────────────────────────────────────────────────────

type AliasEntry = {
  alias: string;
  productId: string;
  product: { id: string; name: string };
};

type Product = { id: string; name: string };

function ProductAliasCard({ password }: { password: string }) {
  const [aliases, setAliases] = useState<AliasEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ alias: "", productId: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/product-aliases").then((r) => r.json()).then(setAliases);
    fetch("/api/master").then((r) => r.json()).then((d) => setProducts(d.products));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.alias.trim() || !form.productId) return;
    setSaving(true);
    setMsg("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (password) headers["authorization"] = `Bearer ${password}`;
      const res = await fetch("/api/product-aliases", {
        method: "POST",
        headers,
        body: JSON.stringify({ alias: form.alias.trim(), productId: form.productId }),
      });
      if (res.ok) {
        setForm({ alias: "", productId: "" });
        setMsg("已保存");
        load();
      } else {
        const d = await res.json();
        setMsg(d.error ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(alias: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (password) headers["authorization"] = `Bearer ${password}`;
    await fetch("/api/product-aliases", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ alias }),
    });
    load();
  }

  return (
    <Card className="max-w-xl">
      <CardTitle>商品名对照（进货名 → 销售名）</CardTitle>
      <p className="mt-1 text-xs text-slate-500">
        进货单里的商品名与销售系统名称不同时，在此设置对应关系。导入进货数据时自动使用。
      </p>
      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          placeholder="进货名称（如：小水白）"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          value={form.alias}
          onChange={(e) => setForm({ ...form, alias: e.target.value })}
        />
        <select
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
        >
          <option value="">对应销售商品</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
        >
          添加
        </button>
      </form>
      {msg && <p className="mt-2 text-xs text-green-600">{msg}</p>}
      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {aliases.length === 0 && (
          <li className="py-2 text-slate-400">暂无对照记录</li>
        )}
        {aliases.map((a) => (
          <li key={a.alias} className="flex items-center justify-between py-2">
            <span>
              <span className="font-medium text-slate-700">{a.alias}</span>
              <span className="mx-2 text-slate-400">→</span>
              <span className="text-slate-600">{a.product.name}</span>
            </span>
            <button
              onClick={() => handleDelete(a.alias)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [password, setPassword] = useState("");

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">数据导入</h1>
      <p className="mb-4 text-sm text-slate-500">
        上传 Excel 文件，系统将自动解析并导入数据。
      </p>

      {/* Global password */}
      <div className="mb-6 max-w-xl">
        <label className="mb-1 block text-sm text-slate-600">管理密码（所有操作共用）</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入管理密码"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="space-y-8">
        <SalesImportCard password={password} />
        <PurchaseImportCard password={password} />
        <ProductAliasCard password={password} />
      </div>
    </>
  );
}
