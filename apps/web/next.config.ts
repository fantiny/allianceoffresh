import type { NextConfig } from "next";

const path = require("path");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/database", "@repo/shared"],
  serverExternalPackages: ["@prisma/client", "exceljs"],
  // Tell Vercel's file tracer to look at the monorepo root so that
  // packages/database and packages/shared are traced correctly.
  // The Prisma binary is copied into apps/web/node_modules/.prisma/client/
  // during the build command (before `next build` runs), so the standard
  // file tracer picks it up automatically.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
