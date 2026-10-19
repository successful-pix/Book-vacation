import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sakvxjyemhvzetlxhucd.supabase.co";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";

function clientFor(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "").trim();
  if (!token) return null;
  return createClient(url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: "Bearer " + token } },
  });
}

async function verifyAdmin(client: ReturnType<typeof createClient>, token: string) {
  const { data: { user }, error: userError } = await client.auth.getUser(token);
  if (userError || !user) return { error: NextResponse.json({ error: "Your session is invalid. Sign in again." }, { status: 401 }) } as const;
  const { data: membership, error } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !membership) return { error: NextResponse.json({ error: "Only an existing authorised admin can manage admins." }, { status: 403 }) } as const;
  return { user } as const;
}

export async function GET(request: Request) {
  const client = clientFor(request);
  if (!client) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "").trim() || "";
    const auth = await verifyAdmin(client, token);
    if ("error" in auth) return auth.error;
    const { data, error } = await client.rpc("admin_list_registered_users");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data || [], total: (data || []).length });
  } catch {
    return NextResponse.json({ error: "Could not load registered users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = clientFor(request);
  if (!client) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const auth = await verifyAdmin(client);
    if ("error" in auth) return auth.error;
    const body = await request.json() as { userId?: string; makeAdmin?: boolean };
    const targetId = String(body.userId || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId) || typeof body.makeAdmin !== "boolean") {
      return NextResponse.json({ error: "Select a valid registered user and role." }, { status: 400 });
    }
    const { data, error } = await client.rpc("admin_set_user_role", { p_user_id: targetId, p_make_admin: body.makeAdmin });
    if (error) {
      const status = /authorised administrator/i.test(error.message) ? 403 : /not found/i.test(error.message) ? 404 : /last administrator/i.test(error.message) ? 409 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ success: true, message: data || "User role updated." });
  } catch {
    return NextResponse.json({ error: "Could not update admin access." }, { status: 500 });
  }
}
