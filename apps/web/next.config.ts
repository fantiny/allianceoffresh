import type { NextConfig } from "next";

const path = require("path");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/database", "@repo/shared"],
  serverExternalPackages: ["@prisma/client", "exceljs"],
  experimental: {
    // Tell Vercel's file tracer to bundle the Prisma query-engine binary.
    // In pnpm monorepo, prisma generate writes the binary to
    // packages/database/node_modules/.prisma/client/ which is outside
    // apps/web, so we must explicitly include it.
    outputFileTracingRoot: path.join(__dirname, "../../"),
    outputFileTracingIncludes: {
      "/**": [
        "packages/database/node_modules/.prisma/client/**",
        "node_modules/.prisma/client/**",
      ],
    },
  },
};

export default nextConfig;
