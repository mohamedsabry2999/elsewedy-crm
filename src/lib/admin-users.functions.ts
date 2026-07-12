import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_EMAIL = "mohamedsabryabdelfatah@gmail.com";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (error || !data) throw new Error("Forbidden: super_admin required");
}

async function logAudit(admin: any, performedBy: string, action: string, targetUser: string | null, details: any) {
  await admin.from("audit_logs").insert({ action, performed_by: performedBy, target_user: targetUser, details });
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles").select("*").order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);
    const { data: rolesRows } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const rolesByUser = new Map<string, string[]>();
    (rolesRows ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const authByUser = new Map<string, any>();
    (authList?.users ?? []).forEach((u: any) => authByUser.set(u.id, u));
    return (profiles ?? []).map((p: any) => ({
      ...p,
      roles: rolesByUser.get(p.id) ?? [],
      last_sign_in_at: authByUser.get(p.id)?.last_sign_in_at ?? null,
      is_owner: p.email === OWNER_EMAIL,
    }));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    email: string; password: string; full_name: string;
    phone?: string; department?: string; job_title?: string;
    role: string; manager_id?: string | null; notes?: string;
    status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.email || !data.password || data.password.length < 8) throw new Error("بيانات ناقصة أو كلمة مرور ضعيفة");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "فشل إنشاء الحساب");
    const uid = created.user.id;
    await supabaseAdmin.from("profiles").upsert({
      id: uid, full_name: data.full_name, email: data.email,
      phone: data.phone ?? null, department: data.department ?? null,
      job_title: data.job_title ?? null, manager_id: data.manager_id ?? null,
      notes: data.notes ?? null, status: data.status ?? "active",
    });
    // Reset default role assigned by trigger, then set requested role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role as any });
    await logAudit(supabaseAdmin, context.userId, "user_created", uid, { email: data.email, role: data.role });
    return { id: uid };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string; full_name?: string; phone?: string; department?: string;
    job_title?: string; manager_id?: string | null; notes?: string;
    status?: string; role?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Protect owner: prevent status change or role removal for owner
    const { data: target } = await supabaseAdmin.from("profiles").select("email").eq("id", data.id).maybeSingle();
    const isOwner = target?.email === OWNER_EMAIL;
    const patch: any = {};
    for (const k of ["full_name","phone","department","job_title","manager_id","notes","status"] as const) {
      if ((data as any)[k] !== undefined) patch[k] = (data as any)[k];
    }
    if (isOwner) { delete patch.status; }
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (data.role && !isOwner) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role as any });
    }
    await logAudit(supabaseAdmin, context.userId, "user_updated", data.id, { patch, role: data.role });
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; password: string; force_change?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.password || data.password.length < 8) throw new Error("كلمة المرور ضعيفة");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    if (data.force_change) {
      await supabaseAdmin.from("profiles").update({ must_change_password: true }).eq("id", data.id);
    }
    await logAudit(supabaseAdmin, context.userId, "password_reset", data.id, { force_change: !!data.force_change });
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin.from("profiles").select("email").eq("id", data.id).maybeSingle();
    if (target?.email === OWNER_EMAIL) throw new Error("لا يمكن حذف حساب المالك");
    if (data.id === context.userId) throw new Error("لا يمكنك حذف حسابك");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    await logAudit(supabaseAdmin, context.userId, "user_deleted", data.id, { email: target?.email });
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { current_password: string; new_password: string }) => d)
  .handler(async ({ data, context }) => {
    if (!data.new_password || data.new_password.length < 8) throw new Error("كلمة المرور الجديدة ضعيفة");
    // Verify current password by attempting sign-in with a fresh client
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const tmp = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: me } = await context.supabase.auth.getUser();
    const email = me.user?.email;
    if (!email) throw new Error("تعذّر التحقق من الحساب");
    const { error: signInErr } = await tmp.auth.signInWithPassword({ email, password: data.current_password });
    if (signInErr) throw new Error("كلمة المرور الحالية غير صحيحة");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.new_password });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").update({ must_change_password: false }).eq("id", context.userId);
    await logAudit(supabaseAdmin, context.userId, "password_self_change", context.userId, {});
    return { ok: true };
  });

export const updateOwnProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name?: string; phone?: string; avatar_url?: string; job_title?: string }) => d)
  .handler(async ({ data, context }) => {
    const patch: any = {};
    for (const k of ["full_name","phone","avatar_url","job_title"] as const) {
      if ((data as any)[k] !== undefined) patch[k] = (data as any)[k];
    }
    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
