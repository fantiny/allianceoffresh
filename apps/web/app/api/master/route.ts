import { prisma } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET() {
  const [customers, products, venues, paymentStatuses] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.venue.findMany({ orderBy: { code: "asc" } }),
    prisma.paymentStatus.findMany(),
  ]);
  return NextResponse.json({ customers, products, venues, paymentStatuses });
}
