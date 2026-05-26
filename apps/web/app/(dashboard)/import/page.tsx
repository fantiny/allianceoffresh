"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    stats?: Record<string, number>;
    warnings?: string[];
    error?: string;
  } | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
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
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">数据导入</h1>
      <p className="mb-6 text-sm text-slate-500">
        上传《每日交易金额汇总表》Excel，系统将解析联盟销售统计、报价表、商品别称等数据。
      </p>
      <Card className="max-w-xl">
        <CardTitle>上传 Excel</CardTitle>
        <div className="mt-6 space-y-4">
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 transition hover:border-brand hover:bg-brand-light/30"
          >
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
              <input
                type="radio"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              覆盖导入
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={mode === "append"}
                onChange={() => setMode("append")}
              />
              追加导入
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">管理密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理密码"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "导入中..." : "开始导入"}
          </button>
        </div>
        {result && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
            {result.error && (
              <p className="text-red-600">{result.error}</p>
            )}
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
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
