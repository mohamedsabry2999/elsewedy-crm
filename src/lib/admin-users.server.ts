export const OWNER_EMAIL = "mohamedsabryabdelfatah@gmail.com";

export async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (error || !data) throw new Error("Forbidden: super_admin required");
}

export async function logAudit(admin: any, performedBy: string, action: string, targetUser: string | null, details: any) {
  await admin.from("audit_logs").insert({ action, performed_by: performedBy, target_user: targetUser, details });
}
