"use client";

export function ExportButton({
  reportType,
  searchParams,
}: {
  reportType: string;
  searchParams: string;
}) {
  return (
    <a
      href={`/api/export?type=${reportType}&${searchParams}`}
      className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      download
    >
      导出 Excel
    </a>
  );
}
