import { NextRequest } from "next/server";

export function checkAuth(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return true;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === password;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "未授权" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
