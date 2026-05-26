"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Link2, Unlink, CheckCircle2, AlertCircle } from "lucide-react";

type Product = {
  id: string;
  name: string;
  _count: { salesLines: number; purchaseLines: number };
  aliases: { alias: string }[];
};

type AliasEntry = {
  alias: string;
  productId: string;
  product: { id: string; name: string };
};

type Data = {
  aliases: AliasEntry[];
  products: Product[];
};

// ── helpers ───────────────────────────────────────────────────────────────────

function getStoredPassword() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_pw") ?? "";
}

function authHeaders(pw: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (pw) h["authorization"] = `Bearer ${pw}`;
  return h;
}

// ── Unmapped products section ─────────────────────────────────────────────────

function UnmappedRow({
  product,
  salesProducts,
  password,
  onLinked,
}: {
  product: Product;
  salesProducts: Product[];
  password: string;
  onLinked: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleLink() {
    if (!selectedId) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/product-aliases", {
        method: "POST",
        headers: authHeaders(password),
        body: JSON.stringify({ alias: product.name, productId: selectedId, merge: true }),
      });
      if (res.ok) {
        onLinked();
      } else {
        const d = await res.json();
        setErr(d.error ?? "操作失败");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4">
        <span className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-medium text-slate-800">{product.name}</span>
        </span>
        <span className="ml-6 text-xs text-slate-400">
          采购 {product._count.purchaseLines} 笔
        </span>
      </td>
      <td className="py-3 pr-4">
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">— 选择对应销售商品 —</option>
          {salesProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（销售 {p._count.salesLines} 笔）
            </option>
          ))}
        </select>
        {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      </td>
      <td className="py-3 text-right">
        <button
          onClick={handleLink}
          disabled={!selectedId || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-40"
        >
          <Link2 className="h-3.5 w-3.5" />
          {saving ? "保存中…" : "关联"}
        </button>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [data, setData] = useState<Data>({ aliases: [], products: [] });
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"unmapped" | "mapped">("unmapped");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pwInput, setPwInput] = useState("");

  // Load password from localStorage on mount
  useEffect(() => {
    const pw = getStoredPassword();
    setPassword(pw);
    setPwInput(pw);
  }, []);

  const load = useCallback(() => {
    fetch("/api/product-aliases")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => { load(); }, [load]);

  function savePw() {
    localStorage.setItem("admin_pw", pwInput);
    setPassword(pwInput);
  }

  // Products that only appear in purchases (no sales lines) and are NOT already
  // the canonical target of an alias
  const aliasedNames = new Set(data.aliases.map((a) => a.alias));
  const canonicalIds = new Set(data.aliases.map((a) => a.productId));

  const unmappedPurchaseProducts = data.products.filter(
    (p) =>
      p._count.purchaseLines > 0 &&
      p._count.salesLines === 0 &&
      !aliasedNames.has(p.name) && // not already set as an alias
      !canonicalIds.has(p.id),       // not the canonical target
  );

  const salesProducts = data.products.filter((p) => p._count.salesLines > 0);

  async function handleUnlink(alias: string) {
    setDeleting(alias);
    await fetch("/api/product-aliases", {
      method: "DELETE",
      headers: authHeaders(password),
      body: JSON.stringify({ alias }),
    });
    setDeleting(null);
    load();
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">商品名称管理</h1>
      <p className="mb-6 text-sm text-slate-500">
        将进货单里的商品名与销售系统的商品名关联，关联后采购记录、库存流水、报表自动合并显示。
      </p>

      {/* Password */}
      <div className="mb-6 flex items-end gap-3 max-w-md">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">管理密码</label>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && savePw()}
            placeholder="输入后按 Enter 保存"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          onClick={savePw}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          保存
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {(
          [
            {
              key: "unmapped",
              label: `待关联（${unmappedPurchaseProducts.length}）`,
              badge: unmappedPurchaseProducts.length > 0,
            },
            { key: "mapped", label: `已关联（${data.aliases.length}）`, badge: false },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.badge && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-400" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Unmapped */}
      {tab === "unmapped" && (
        <Card>
          <CardTitle>待关联的进货商品</CardTitle>
          <p className="mt-1 mb-4 text-xs text-slate-500">
            这些商品来自进货单，在销售系统中找不到同名商品。请为每个进货名指定对应的销售商品，关联后历史采购记录将自动迁移。
          </p>
          {unmappedPurchaseProducts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              所有进货商品均已关联，无需操作。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-4 font-medium">进货名称</th>
                    <th className="pb-2 pr-4 font-medium">对应销售商品</th>
                    <th className="pb-2 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {unmappedPurchaseProducts.map((p) => (
                    <UnmappedRow
                      key={p.id}
                      product={p}
                      salesProducts={salesProducts}
                      password={password}
                      onLinked={load}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Mapped */}
      {tab === "mapped" && (
        <Card>
          <CardTitle>已关联清单</CardTitle>
          <p className="mt-1 mb-4 text-xs text-slate-500">
            进货名称与销售商品的对应关系。删除后采购记录将不再自动合并，但历史数据已迁移不受影响。
          </p>
          {data.aliases.length === 0 ? (
            <p className="text-sm text-slate-400">暂无关联记录。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-6 font-medium">进货名称</th>
                    <th className="pb-2 pr-6 font-medium">→ 对应销售商品</th>
                    <th className="pb-2 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.aliases.map((a) => (
                    <tr key={a.alias} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-6">
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                          {a.alias}
                        </span>
                      </td>
                      <td className="py-3 pr-6">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-slate-700">
                            {a.product.name}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleUnlink(a.alias)}
                          disabled={deleting === a.alias}
                          className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          {deleting === a.alias ? "删除中…" : "取消关联"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Manual add form */}
          <ManualAddForm
            products={data.products}
            password={password}
            onAdded={load}
          />
        </Card>
      )}
    </>
  );
}

// ── Manual add form ───────────────────────────────────────────────────────────

function ManualAddForm({
  products,
  password,
  onAdded,
}: {
  products: Product[];
  password: string;
  onAdded: () => void;
}) {
  const [alias, setAlias] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alias.trim() || !productId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/product-aliases", {
        method: "POST",
        headers: authHeaders(password),
        body: JSON.stringify({ alias: alias.trim(), productId, merge: true }),
      });
      if (res.ok) {
        setAlias("");
        setProductId("");
        setMsg("已保存");
        onAdded();
      } else {
        const d = await res.json();
        setMsg(d.error ?? "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <p className="mb-3 text-xs font-medium text-slate-500">手动添加对照关系</p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          placeholder="进货名称（如：小水白）"
          className="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
        <span className="self-center text-slate-400">→</span>
        <select
          className="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">选择对应销售商品</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !alias.trim() || !productId}
          className="rounded-lg bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-40"
        >
          {saving ? "保存中…" : "添加"}
        </button>
      </form>
      {msg && (
        <p className={`mt-2 text-xs ${msg === "已保存" ? "text-green-600" : "text-red-500"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
