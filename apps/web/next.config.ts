import type { NextConfig } from "next";

const path = require("path");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/database", "@repo/shared"],
  serverExternalPackages: ["@prisma/client", "exceljs"],
};

export default nextConfig;
