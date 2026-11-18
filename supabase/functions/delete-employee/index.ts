
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

    const admin = createClient(
      Deno.env.get("MY_PROJECT_URL")!,
      Deno.env.get("MY_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");

    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token);

    if (userErr || !user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Super Admin is identified by immutable Auth UID.
    const isSuperAdmin = user.id === SUPER_ADMIN_UID;

    if (!isSuperAdmin) {
      const { data: actor, error: actorErr } = await admin
        .from("profiles")
        .select("role,is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (actorErr || !actor || !actor.is_active) {
        return Response.json(
          { error: "Your account is inactive or unauthorized." },
          { status: 403, headers: corsHeaders }
        );
      }

      // Check designation-based employee management permission.
      const { data: permission, error: permissionErr } = await admin
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
          { error: "You do not have permission to delete employees." },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    const body = await req.json();
    const employeeId = body.employee_id;

    if (!employeeId) {
      return Response.json(
        { error: "Employee ID is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: employee, error: lookupErr } = await admin
      .from("employee_directory")
      .select("id,auth_user_id,full_name")
      .eq("id", employeeId)
      .maybeSingle();

    if (lookupErr || !employee) {
      return Response.json(
        { error: "Employee not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Never allow deleting the Super Admin account.
    if (employee.auth_user_id === SUPER_ADMIN_UID) {
      return Response.json(
        { error: "The Super Admin account cannot be deleted." },
        { status: 403, headers: corsHeaders }
      );
    }

    // Prevent an employee from deleting their own account.
    if (employee.auth_user_id === user.id) {
      return Response.json(
        { error: "You cannot delete your own account." },
        { status: 403, headers: corsHeaders }
      );
    }

    if (employee.auth_user_id) {
      // Preserve project history but remove the deleted user's author reference.
      const { error: historyErr } = await admin
        .from("project_updates")
        .update({ author_id: null })
        .eq("author_id", employee.auth_user_id);

      if (historyErr) {
        return Response.json(
          { error: "Project history update failed: " + historyErr.message },
          { status: 400, headers: corsHeaders }
        );
      }

      // Delete profile.
      const { error: profileErr } = await admin
        .from("profiles")
        .delete()
        .eq("id", employee.auth_user_id);

      if (profileErr) {
        return Response.json(
          { error: "Profile delete failed: " + profileErr.message },
          { status: 400, headers: corsHeaders }
        );
      }

      // Delete login account.
      const { error: authErr } = await admin.auth.admin.deleteUser(
        employee.auth_user_id
      );

      if (
        authErr &&
        !authErr.message.toLowerCase().includes("not found")
      ) {
        return Response.json(
          { error: "Login account delete failed: " + authErr.message },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Delete employee directory record after account operations.
    const { error: dirErr } = await admin
      .from("employee_directory")
      .delete()
      .eq("id", employeeId);

    if (dirErr) {
      return Response.json(
        { error: "Directory delete failed: " + dirErr.message },
        { status: 400, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Employee and login account deleted.",
      },
      { headers: corsHeaders }
    );
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Unexpected error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
