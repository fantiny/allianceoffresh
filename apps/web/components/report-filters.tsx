"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type MasterData = {
  customers: { id: string; name: string }[];
  products: { id: string; name: string }[];
  venues: { id: string; code: string }[];
  paymentStatuses: { id: string; name: string }[];
};

export function ReportFilters({ showExcludeDeposit = false }: { showExcludeDeposit?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [masters, setMasters] = useState<MasterData | null>(null);

  useEffect(() => {
    fetch("/api/master")
      .then((r) => r.json())
      .then(setMasters)
      .catch(console.error);
  }, []);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const inputClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        开始日期
        <input
          type="date"
          className={inputClass}
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        结束日期
        <input
          type="date"
          className={inputClass}
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
        />
      </label>
      {masters && (
        <>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            客户
            <select
              className={inputClass}
              defaultValue={searchParams.get("customerId") ?? ""}
              onChange={(e) => update("customerId", e.target.value)}
            >
              <option value="">全部</option>
              {masters.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            商品
            <select
              className={inputClass}
              defaultValue={searchParams.get("productId") ?? ""}
              onChange={(e) => update("productId", e.target.value)}
            >
              <option value="">全部</option>
              {masters.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            场所
            <select
              className={inputClass}
              defaultValue={searchParams.get("venueId") ?? ""}
              onChange={(e) => update("venueId", e.target.value)}
            >
              <option value="">全部</option>
              {masters.venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            付款状态
            <select
              className={inputClass}
              defaultValue={searchParams.get("paymentStatusId") ?? ""}
              onChange={(e) => update("paymentStatusId", e.target.value)}
            >
              <option value="">全部</option>
              {masters.paymentStatuses.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {showExcludeDeposit && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            defaultChecked={searchParams.get("excludeDeposit") === "true"}
            onChange={(e) =>
              update("excludeDeposit", e.target.checked ? "true" : "")
            }
          />
          排除框子押金
        </label>
      )}
    </div>
  );
}
