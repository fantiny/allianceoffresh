import type { NextConfig } from "next";

const path = require("path");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/database", "@repo/shared"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  serverExternalPackages: ["@prisma/client", "exceljs"],
};

export default nextConfig;
