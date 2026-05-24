import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { parseWorkbookBuffer } from "@repo/database/src/excel/parser";
import { importWorkbook } from "@repo/database/src/excel/importer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const mode = (form.get("mode") as string) === "append" ? "append" : "replace";

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseWorkbookBuffer(buffer);
  const result = await importWorkbook(parsed, {
    filename: file.name,
    buffer,
    mode,
    autoInventory: process.env.AUTO_INVENTORY !== "false",
  });

  return NextResponse.json(result);
}
