import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NOT SET";
  const dbUnpooled = process.env.DATABASE_URL_UNPOOLED || "NOT SET";

  // Only reveal host (not password) for safety
  const maskUrl = (url: string) => {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.username}:***@${u.hostname}:${u.port || "default"}${u.pathname}${u.search}`;
    } catch {
      return url.substring(0, 20) + "...(parse error)";
    }
  };

  // Try a simple Prisma query
  let prismaStatus = "not tested";
  try {
    const { prisma } = await import("@repo/database");
    await prisma.$queryRaw`SELECT 1`;
    prismaStatus = "ok";
  } catch (e: unknown) {
    prismaStatus =
      e instanceof Error ? e.message.substring(0, 300) : String(e);
  }

  return NextResponse.json({
    DATABASE_URL: maskUrl(dbUrl),
    DATABASE_URL_UNPOOLED: maskUrl(dbUnpooled),
    NODE_VERSION: process.version,
    prismaStatus,
  });
}
