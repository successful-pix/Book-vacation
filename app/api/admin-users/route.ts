import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sakvxjyemhvzetlxhucd.supabase.co";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

function clients(token: string) {
  const userClient = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: "Bearer " + token } } });
  const adminClient = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return { userClient, adminClient };
}

async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) } as const;
  const { userClient, adminClient } = clients(token);
  if (!adminClient) return { error: NextResponse.json({ error: "Admin user management is not configured. Add SUPABASE_SERVICE_ROLE_KEY to Vercel server environment variables." }, { status: 503 }) } as const;
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return { error: NextResponse.json({ error: "Your session is invalid. Sign in again." }, { status: 401 }) } as const;
  const { data: membership, error } = await adminClient.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !membership) return { error: NextResponse.json({ error: "Only an existing authorised admin can manage admins." }, { status: 403 }) } as const;
  return { adminClient, actorId: user.id } as const;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;
    const { data: usersData, error: usersError } = await auth.adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
    const { data: admins, error: adminsError } = await auth.adminClient.from("admin_users").select("user_id,created_at");
    if (adminsError) return NextResponse.json({ error: adminsError.message }, { status: 500 });
    const adminMap = new Map((admins || []).map((row: { user_id: string; created_at: string }) => [row.user_id, row.created_at]));
    const users = (usersData.users || []).map(user => ({
      id: user.id,
      email: user.email || "",
      name: String(user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || ""),
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      email_confirmed: Boolean(user.email_confirmed_at),
      is_admin: adminMap.has(user.id),
      admin_since: adminMap.get(user.id) || null,
    })).sort((a, b) => a.email.localeCompare(b.email));
    return NextResponse.json({ users, total: users.length });
  } catch {
    return NextResponse.json({ error: "Could not load registered users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;
    const body = await request.json() as { userId?: string; makeAdmin?: boolean };
    const targetId = String(body.userId || "");
    const makeAdmin = body.makeAdmin === true;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
      return NextResponse.json({ error: "Select a valid registered user." }, { status: 400 });
    }
    const { data: target, error: targetError } = await auth.adminClient.auth.admin.getUserById(targetId);
    if (targetError || !target.user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const { data: existing, error: readError } = await auth.adminClient.from("admin_users").select("user_id");
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
    const currentlyAdmin = (existing || []).some((row: { user_id: string }) => row.user_id === targetId);
    if (currentlyAdmin === makeAdmin) return NextResponse.json({ message: makeAdmin ? "This user is already an admin." : "This user is already a regular user." });
    if (!makeAdmin && currentlyAdmin && (existing || []).length <= 1) {
      return NextResponse.json({ error: "You cannot remove the last administrator." }, { status: 409 });
    }
    if (makeAdmin) {
      const { error } = await auth.adminClient.from("admin_users").insert({ user_id: targetId });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await auth.adminClient.from("admin_users").delete().eq("user_id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: makeAdmin ? "Admin access granted to " + (target.user.email || "the selected user") + "." : "Admin access removed from " + (target.user.email || "the selected user") + "." });
  } catch {
    return NextResponse.json({ error: "Could not update admin access." }, { status: 500 });
  }
}
