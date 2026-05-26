import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { parsePurchaseWorkbookBuffer } from "@repo/database/src/excel/purchase-parser";
import { importPurchaseWorkbook } from "@repo/database/src/excel/purchase-importer";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const mode = (form.get("mode") as string) === "append" ? "append" : "replace";

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parsePurchaseWorkbookBuffer(buffer);
  const result = await importPurchaseWorkbook(parsed, {
    mode,
    autoInventory: process.env.AUTO_INVENTORY !== "false",
  });

  return NextResponse.json(result);
}
