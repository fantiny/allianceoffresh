"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Upload, Tags } from "lucide-react";
import Link from "next/link";

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
      const res = await fetch("/api/import", { method: "POST", body: form, headers });
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
      const res = await fetch("/api/import/purchases", { method: "POST", body: form, headers });
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
                  新增进货商品：{result.stats.newProducts} 个
                </li>
              )}
            </ul>
          )}
          {result.stats && result.stats.newProducts > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              有部分进货商品未匹配到销售商品，请前往
              <Link href="/products" className="mx-1 font-medium underline">
                商品名称管理
              </Link>
              设置进销名称对应关系。
            </div>
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

        {/* Link to product mapping page */}
        <div className="max-w-xl rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
              <Tags className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">商品名称管理</p>
              <p className="text-xs text-slate-500">
                设置进货名与销售商品的对应关系，关联后系统自动合并显示
              </p>
            </div>
            <Link
              href="/products"
              className="ml-auto shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              前往管理 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
