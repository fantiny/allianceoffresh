import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { parseWorkbookBuffer } from "./parser";

describe("parseWorkbookBuffer", () => {
  it("parses sample excel with expected row counts", async () => {
    const path = resolve(
      __dirname,
      "../../../../data/samples/联盟销售汇总样例.xlsx",
    );
    if (!existsSync(path)) {
      console.warn("Skip: sample xlsx not present (real data excluded from git)");
      return;
    }
    const buffer = readFileSync(path);
    const parsed = await parseWorkbookBuffer(buffer);
    expect(parsed.sales.length).toBeGreaterThan(700);
    expect(parsed.aliases.length).toBeGreaterThan(50);
    expect(parsed.quotes.length).toBeGreaterThan(400);
    const totalSettlement = parsed.sales.reduce(
      (s, r) => s + r.settlementAmount,
      0,
    );
    expect(totalSettlement).toBeGreaterThan(140000);
    expect(totalSettlement).toBeLessThan(145000);
  });
});
