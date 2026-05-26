"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Link2, Unlink, CheckCircle2, AlertCircle, Pencil, X, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  unit: string;
  isDeposit: boolean;
  groupName: string | null;
  _count: { salesLines: number; purchaseLines: number };
};

type AliasEntry = {
  alias: string;
  productId: string;
  product: { id: string; name: string };
};

type AliasData = {
  aliases: AliasEntry[];
  products: { id: string; name: string; _count: { salesLines: number; purchaseLines: number }; aliases: { alias: string }[] }[];
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

// ── Inline editable group name cell ──────────────────────────────────────────

function GroupNameCell({
  id,
  name,
  groupName,
  password,
  onSaved,
  apiPath,
}: {
  id: string;
  name: string;
  groupName: string | null;
  password: string;
  onSaved: (id: string, newGroupName: string | null) => void;
  apiPath: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(groupName ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: authHeaders(password),
        body: JSON.stringify({ id, groupName: value.trim() || null }),
      });
      if (res.ok) {
        const d = await res.json();
        onSaved(id, d.groupName);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setValue(groupName ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <span className="group flex items-center gap-1.5">
        {groupName ? (
          <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {groupName}
          </span>
        ) : (
          <span className="text-slate-300 text-xs italic">未设置</span>
        )}
        <button
          onClick={() => { setValue(groupName ?? ""); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-brand"
          title="编辑分组名"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        placeholder={`同 ${name}`}
        className="w-36 rounded border border-brand px-2 py-0.5 text-xs outline-none"
      />
      <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={cancel} className="text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </span>
  );
}

// ── Product Group Tab ─────────────────────────────────────────────────────────

function ProductGroupTab({ password }: { password: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<"all" | "grouped" | "ungrouped">("all");

  const load = useCallback(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(id: string, newGroupName: string | null) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, groupName: newGroupName } : p));
  }

  const filtered = products.filter((p) => {
    if (filter === "grouped") return !!p.groupName;
    if (filter === "ungrouped") return !p.groupName;
    return true;
  });

  // Group preview: how many products share each groupName
  const groupCounts = new Map<string, number>();
  for (const p of products) {
    if (p.groupName) groupCounts.set(p.groupName, (groupCounts.get(p.groupName) ?? 0) + 1);
  }

  return (
    <Card>
      <CardTitle>商品统计分组名</CardTitle>
      <p className="mt-1 mb-4 text-xs text-slate-500">
        为商品设置分组名后，报表统计时会将同一分组名的商品数据合并显示。
        例如将"地冬瓜"和"吊瓜"都设为"冬瓜"，报表就会合并统计。
        <br />
        鼠标悬停在分组名列上，点击铅笔图标即可编辑。回车保存，Esc 取消。
      </p>

      <div className="mb-3 flex gap-2">
        {([["all", "全部"], ["grouped", "已设置"], ["ungrouped", "未设置"]] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="pb-2 pr-6 font-medium">商品名称</th>
              <th className="pb-2 pr-6 font-medium">分组名（统计用）</th>
              <th className="pb-2 pr-6 font-medium text-right">采购</th>
              <th className="pb-2 font-medium text-right">销售</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">暂无数据</td>
              </tr>
            )}
            {filtered.map((p) => {
              const count = p.groupName ? groupCounts.get(p.groupName) ?? 1 : 1;
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-6">
                    <span className="font-medium text-slate-800">{p.name}</span>
                    {p.isDeposit && (
                      <span className="ml-1.5 text-xs text-slate-400">押金</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-6">
                    <GroupNameCell
                      id={p.id}
                      name={p.name}
                      groupName={p.groupName}
                      password={password}
                      onSaved={handleSaved}
                      apiPath="/api/products"
                    />
                    {count > 1 && (
                      <span className="ml-2 text-xs text-slate-400">
                        （含 {count} 个商品）
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-6 text-right text-slate-500">
                    {p._count.purchaseLines}
                  </td>
                  <td className="py-2.5 text-right text-slate-500">
                    {p._count.salesLines}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Alias Tab ─────────────────────────────────────────────────────────────────

function UnmappedRow({
  product,
  salesProducts,
  password,
  onLinked,
}: {
  product: { id: string; name: string; _count: { salesLines: number; purchaseLines: number }; aliases: { alias: string }[] };
  salesProducts: { id: string; name: string; _count: { salesLines: number; purchaseLines: number }; aliases: { alias: string }[] }[];
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

function AliasTab({ password }: { password: string }) {
  const [data, setData] = useState<AliasData>({ aliases: [], products: [] });
  const [aliasTab, setAliasTab] = useState<"unmapped" | "mapped">("unmapped");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/product-aliases").then((r) => r.json()).then(setData);
  }, []);
  useEffect(() => { load(); }, [load]);

  const aliasedNames = new Set(data.aliases.map((a) => a.alias));
  const canonicalIds = new Set(data.aliases.map((a) => a.productId));
  const unmapped = data.products.filter(
    (p) =>
      p._count.purchaseLines > 0 &&
      p._count.salesLines === 0 &&
      !aliasedNames.has(p.name) &&
      !canonicalIds.has(p.id),
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlias.trim() || !newProductId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/product-aliases", {
        method: "POST",
        headers: authHeaders(password),
        body: JSON.stringify({ alias: newAlias.trim(), productId: newProductId, merge: true }),
      });
      if (res.ok) { setNewAlias(""); setNewProductId(""); setMsg("已保存"); load(); }
      else { const d = await res.json(); setMsg(d.error ?? "保存失败"); }
    } finally { setSaving(false); }
  }

  return (
    <Card>
      <CardTitle>进货名称关联</CardTitle>
      <p className="mt-1 mb-4 text-xs text-slate-500">
        将进货单里的商品名与销售系统的商品名关联。关联后历史采购记录自动迁移。
      </p>

      <div className="mb-4 flex gap-1 border-b border-slate-100">
        {([
          { key: "unmapped", label: `待关联（${unmapped.length}）`, badge: unmapped.length > 0 },
          { key: "mapped", label: `已关联（${data.aliases.length}）`, badge: false },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setAliasTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              aliasTab === t.key
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.badge && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-400" />}
          </button>
        ))}
      </div>

      {aliasTab === "unmapped" && (
        unmapped.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            所有进货商品均已关联。
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">进货名称</th>
                <th className="pb-2 pr-4 font-medium">对应销售商品</th>
                <th className="pb-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {unmapped.map((p) => (
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
        )
      )}

      {aliasTab === "mapped" && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="pb-2 pr-6 font-medium">进货名称</th>
                <th className="pb-2 pr-6 font-medium">→ 销售商品</th>
                <th className="pb-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.aliases.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400">暂无关联</td></tr>
              )}
              {data.aliases.map((a) => (
                <tr key={a.alias} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-6">
                    <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700 text-xs">{a.alias}</span>
                  </td>
                  <td className="py-2.5 pr-6">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-medium text-slate-700">{a.product.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleUnlink(a.alias)}
                      disabled={deleting === a.alias}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      {deleting === a.alias ? "删除中…" : "取消"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">手动添加</p>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
              <input
                placeholder="进货名称"
                className="flex-1 min-w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
              />
              <span className="self-center text-slate-400 text-sm">→</span>
              <select
                className="flex-1 min-w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
              >
                <option value="">选择销售商品</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || !newAlias.trim() || !newProductId}
                className="rounded-lg bg-brand px-4 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-40"
              >
                添加
              </button>
            </form>
            {msg && <p className={`mt-1 text-xs ${msg === "已保存" ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [password, setPassword] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [tab, setTab] = useState<"group" | "alias">("group");

  useEffect(() => {
    const pw = getStoredPassword();
    setPassword(pw);
    setPwInput(pw);
  }, []);

  function savePw() {
    localStorage.setItem("admin_pw", pwInput);
    setPassword(pwInput);
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">商品名称管理</h1>
      <p className="mb-6 text-sm text-slate-500">
        管理商品的统计分组名（合并统计）和进货名称关联（进销匹配）。
      </p>

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
        <button onClick={savePw} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
          保存
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {([
          { key: "group", label: "商品统计分组" },
          { key: "alias", label: "进货名称关联" },
        ] as const).map((t) => (
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
          </button>
        ))}
      </div>

      {tab === "group" && <ProductGroupTab password={password} />}
      {tab === "alias" && <AliasTab password={password} />}
    </>
  );
}
