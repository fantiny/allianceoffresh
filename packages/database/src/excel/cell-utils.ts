export function cellValue(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === "object") {
    if ("result" in v && (v as { result: unknown }).result != null) {
      return (v as { result: unknown }).result;
    }
    if ("richText" in v) {
      const parts = (v as { richText: { text: string }[] }).richText;
      return parts.map((p) => p.text).join("");
    }
    if ("text" in v) return (v as { text: string }).text;
    if (v instanceof Date) return v;
  }
  return v;
}

export function cellStr(v: unknown): string | null {
  const raw = cellValue(v);
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

export function cellNum(v: unknown): number {
  const raw = cellValue(v);
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function cellDate(v: unknown): Date | null {
  const raw = cellValue(v);
  if (raw instanceof Date) return raw;
  if (typeof raw === "string" && raw) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
