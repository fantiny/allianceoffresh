import { readFileSync } from "fs";
import { resolve } from "path";
import { parseWorkbookBuffer } from "./excel/parser";
import { importWorkbook } from "./excel/importer";

async function main() {
  const samplePath =
    process.argv[2] ??
    resolve(__dirname, "../../../data/samples/联盟销售汇总样例.xlsx");

  console.log("Seeding from:", samplePath);
  const buffer = readFileSync(samplePath);
  const parsed = await parseWorkbookBuffer(buffer);
  console.log(
    `Parsed: ${parsed.sales.length} sales, ${parsed.quotes.length} quotes, ${parsed.aliases.length} aliases`,
  );

  const result = await importWorkbook(parsed, {
    filename: "联盟销售汇总样例.xlsx",
    buffer,
    mode: "replace",
    autoInventory: process.env.AUTO_INVENTORY !== "false",
  });

  console.log("Import result:", result);

  const { prisma } = await import("./index");
  const agg = await prisma.salesLine.aggregate({
    _sum: { settlementAmount: true, unpaidAmount: true, returnAmount: true },
  });
  console.log("Settlement total:", agg._sum.settlementAmount);
  console.log("Unpaid total:", agg._sum.unpaidAmount);
  console.log("Return total:", agg._sum.returnAmount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("./index");
    await prisma.$disconnect();
  });
