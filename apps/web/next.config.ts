import type { NextConfig } from "next";

const path = require("path");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/database", "@repo/shared"],
  serverExternalPackages: ["@prisma/client", "exceljs"],
  // Set tracing root to the monorepo root so that packages/database and
  // packages/shared are traced and included in the Lambda bundle.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // In pnpm monorepos, prisma generate writes the query-engine binary into
  // the pnpm virtual store (node_modules/.pnpm/.../node_modules/.prisma/client/)
  // which @vercel/nft cannot trace statically. Explicitly include it here.
  // Paths are relative to the project directory (apps/web/).
  outputFileTracingIncludes: {
    "/**": [
      "../../node_modules/.pnpm/**/.prisma/client/libquery_engine-*.so.node",
      "../../node_modules/.pnpm/**/.prisma/client/schema.prisma",
    ],
  },
};

export default nextConfig;
