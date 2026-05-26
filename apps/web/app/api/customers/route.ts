import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@repo/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      groupName: true,
      _count: { select: { salesLines: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

/** PATCH body: { id: string, groupName: string | null } */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return unauthorizedResponse();
  const { id, groupName } = (await req.json()) as {
    id: string;
    groupName: string | null;
  };
  if (!id) return NextResponse.json({ error: "id 必填" }, { status: 400 });

  const customer = await prisma.customer.update({
    where: { id },
    data: { groupName: groupName?.trim() || null },
    select: { id: true, name: true, groupName: true },
  });
  return NextResponse.json(customer);
}
