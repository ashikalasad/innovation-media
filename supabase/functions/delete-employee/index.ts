
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPER_ADMIN_UID = "bc251129-3b29-4111-8f59-e68a577a1501";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("MY_PROJECT_URL")!,
      Deno.env.get("MY_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Super Admin is identified by immutable Auth UID.
    const isSuperAdmin = user.id === SUPER_ADMIN_UID;

    // Check the actor's active profile.
    const { data: actor, error: actorErr } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!isSuperAdmin) {
      if (actorErr || !actor || !actor.is_active) {
        return Response.json(
          { error: "Your account is inactive or unauthorized." },
          { status: 403, headers: corsHeaders }
        );
      }

      // Check designation-based permission.
      const { data: permission, error: permissionErr } =
        await supabaseAdmin
          .from("role_permissions")
          .select("can_manage_employees")
          .eq("role", actor.role)
          .maybeSingle();

      if (
        permissionErr ||
        !permission ||
        permission.can_manage_employees !== true
      ) {
        return Response.json(
          { error: "You do not have permission to add employees." },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    const body = await req.json();

    const {
      full_name,
      user_id,
      password,
      role,
      phone,
      whatsapp,
    } = body;

    const uid = String(user_id || "").trim().toLowerCase();
    const name = String(full_name || "").trim();
    const email = `${uid}@innovation.local`;

    if (!name || !uid || !password || password.length < 8) {
      return Response.json(
        {
          error: "Name, User ID and password (8+ characters) are required.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const allowedRoles = [
      "boss",
      "chief_designer",
      "graphics_designer",
      "marketing",
      "operations",
      "pasting",
      "account_manager",
    ];

    if (!/^[a-z0-9._-]{3,32}$/.test(uid)) {
      return Response.json(
        {
          error:
            "User ID must be 3-32 characters (letters, numbers, dot, underscore, hyphen).",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!allowedRoles.includes(role)) {
      return Response.json(
        { error: "Invalid role." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Auth user.
    const {
      data: created,
      error: createErr,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createErr || !created.user) {
      return Response.json(
        { error: createErr?.message || "Could not create user." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create profile.
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: created.user.id,
        full_name: name,
        role,
        phone: phone || null,
        whatsapp: whatsapp || null,
        is_active: true,
      });

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);

      return Response.json(
        { error: profileErr.message },
        { status: 400, headers: corsHeaders }
      );
    }

    // Add employee to directory.
    const { error: dirErr } = await supabaseAdmin
      .from("employee_directory")
      .insert({
        full_name: name,
        role,
        phone: phone || null,
        whatsapp: whatsapp || null,
        created_by: user.id,
        auth_user_id: created.user.id,
      });

    if (dirErr) {
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", created.user.id);

      await supabaseAdmin.auth.admin.deleteUser(created.user.id);

      return Response.json(
        { error: dirErr.message },
        { status: 400, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        success: true,
        user_id: uid,
        login_email: email,
      },
      { headers: corsHeaders }
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
