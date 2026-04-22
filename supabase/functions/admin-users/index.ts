// Admin-only edge function for managing editor accounts.
// Uses the service role to bypass RLS and call Auth Admin APIs.
// Verifies the caller has the `admin` role before performing any action.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);

  // Identify caller
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(url, serviceKey);

  // Verify admin role
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role,is_active")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow || roleRow.is_active === false) {
    return json({ error: "Admin access required" }, 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = body?.action as string;

  try {
    if (action === "list") {
      const { data: usersData, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error) throw error;
      const ids = usersData.users.map((u) => u.id);
      const { data: roles } = await admin
        .from("user_roles")
        .select("user_id, role, is_active, created_at")
        .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      return json({
        users: usersData.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          banned_until: (u as any).banned_until ?? null,
          display_name: profiles?.find((p) => p.id === u.id)?.display_name ?? null,
          roles: (roles ?? []).filter((r) => r.user_id === u.id),
        })),
      });
    }

    if (action === "create") {
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      const role = body.role === "admin" ? "admin" : "editor";
      const display_name = body.display_name ? String(body.display_name) : null;
      if (!email || password.length < 8) {
        return json({ error: "Email and password (min 8 chars) required" }, 400);
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: display_name ? { display_name } : undefined,
      });
      if (error) throw error;
      const uid = created.user!.id;
      // Insert role
      await admin.from("user_roles").insert({ user_id: uid, role, is_active: true });
      // Ensure profile row exists
      await admin
        .from("profiles")
        .upsert({ id: uid, display_name: display_name ?? email.split("@")[0] }, { onConflict: "id" });
      return json({ ok: true, user_id: uid });
    }

    if (action === "update") {
      const uid = String(body.user_id || "");
      if (!uid) return json({ error: "user_id required" }, 400);

      if (typeof body.password === "string" && body.password.length >= 8) {
        const { error } = await admin.auth.admin.updateUserById(uid, { password: body.password });
        if (error) throw error;
      }
      if (typeof body.display_name === "string") {
        await admin.from("profiles").upsert({ id: uid, display_name: body.display_name }, { onConflict: "id" });
      }
      if (body.role === "admin" || body.role === "editor") {
        // Replace primary role
        await admin.from("user_roles").delete().eq("user_id", uid);
        await admin.from("user_roles").insert({
          user_id: uid,
          role: body.role,
          is_active: body.is_active === false ? false : true,
        });
      } else if (typeof body.is_active === "boolean") {
        await admin.from("user_roles").update({ is_active: body.is_active }).eq("user_id", uid);
      }

      // Ban/unban via auth (blocks login when inactive)
      if (typeof body.is_active === "boolean") {
        const banDuration = body.is_active ? "none" : "876000h"; // ~100 years
        const { error } = await admin.auth.admin.updateUserById(uid, {
          ban_duration: banDuration,
        } as any);
        if (error) throw error;
      }
      return json({ ok: true });
    }

    if (action === "delete") {
      const uid = String(body.user_id || "");
      if (!uid) return json({ error: "user_id required" }, 400);
      if (uid === userData.user.id) return json({ error: "Cannot delete yourself" }, 400);
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("profiles").delete().eq("id", uid);
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e?.message ?? "Server error" }, 500);
  }
});
