"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Pencil, X, Check } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  groupName: string | null;
  _count: { salesLines: number };
};

function getStoredPassword() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_pw") ?? "";
}
function authHeaders(pw: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (pw) h["authorization"] = `Bearer ${pw}`;
  return h;
}

// ── Inline edit cell ─────────────────────────────────────────────────────────

function GroupNameCell({
  id,
  name,
  groupName,
  password,
  onSaved,
}: {
  id: string;
  name: string;
  groupName: string | null;
  password: string;
  onSaved: (id: string, newGroupName: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(groupName ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<"all" | "grouped" | "ungrouped">("all");
  const [password, setPassword] = useState("");
  const [pwInput, setPwInput] = useState("");

  useEffect(() => {
    const pw = getStoredPassword();
    setPassword(pw);
    setPwInput(pw);
  }, []);

  const load = useCallback(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, []);

  useEffect(() => { load(); }, [load]);

  function savePw() {
    localStorage.setItem("admin_pw", pwInput);
    setPassword(pwInput);
  }

  function handleSaved(id: string, newGroupName: string | null) {
    setCustomers((prev) =>
      prev.map((c) => c.id === id ? { ...c, groupName: newGroupName } : c)
    );
  }

  const filtered = customers.filter((c) => {
    if (filter === "grouped") return !!c.groupName;
    if (filter === "ungrouped") return !c.groupName;
    return true;
  });

  // Group preview counts
  const groupCounts = new Map<string, number>();
  for (const c of customers) {
    if (c.groupName) groupCounts.set(c.groupName, (groupCounts.get(c.groupName) ?? 0) + 1);
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">客户名称管理</h1>
      <p className="mb-6 text-sm text-slate-500">
        为客户设置公司/分组名，报表统计时会将同一分组名的客户数据合并显示。
        例如同一家公司的不同采购员，设为相同分组名后，报表会合并为一条记录。
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

      <Card>
        <CardTitle>客户分组名（统计用）</CardTitle>
        <p className="mt-1 mb-4 text-xs text-slate-500">
          鼠标悬停在分组名列上，点击铅笔图标即可编辑。回车保存，Esc 取消。
          设置后在客户分析、收款分析等报表中自动合并显示。
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
                <th className="pb-2 pr-6 font-medium">客户名称</th>
                <th className="pb-2 pr-6 font-medium">公司/分组名（统计用）</th>
                <th className="pb-2 font-medium text-right">销售笔数</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">暂无数据</td>
                </tr>
              )}
              {filtered.map((c) => {
                const count = c.groupName ? groupCounts.get(c.groupName) ?? 1 : 1;
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-6 font-medium text-slate-800">{c.name}</td>
                    <td className="py-2.5 pr-6">
                      <GroupNameCell
                        id={c.id}
                        name={c.name}
                        groupName={c.groupName}
                        password={password}
                        onSaved={handleSaved}
                      />
                      {count > 1 && (
                        <span className="ml-2 text-xs text-slate-400">
                          （含 {count} 个客户）
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {c._count.salesLines}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
