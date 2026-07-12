import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { changeOwnPassword, updateOwnProfile } from "@/lib/admin-users.functions";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/permissions";
import { useRoles } from "@/hooks/useRoles";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const { roles } = useRoles();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setProfile(data ?? { id: u.user.id });
    })();
  }, []);

  const [form, setForm] = useState({ full_name: "", phone: "", job_title: "" });
  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      job_title: profile.job_title ?? "",
    });
  }, [profile]);

  const updateFn = useServerFn(updateOwnProfile);
  const saveMut = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => toast.success("تم حفظ الملف الشخصي"),
    onError: (e: any) => toast.error(e.message),
  });

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const pwdFn = useServerFn(changeOwnPassword);
  const pwdMut = useMutation({
    mutationFn: () => pwdFn({ data: { current_password: pwd.current, new_password: pwd.next } }),
    onSuccess: () => { toast.success("تم تغيير كلمة المرور"); setPwd({ current: "", next: "", confirm: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <PageHeader title="الملف الشخصي" description="إدارة معلوماتك الشخصية وكلمة المرور" />

      <Card>
        <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {(form.full_name || email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{form.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">{email}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map((r) => <Badge key={r} variant="outline">{ROLE_LABELS[r] || r}</Badge>)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><Input dir="ltr" value={email} disabled /></div>
            <div className="space-y-1.5"><Label>الهاتف</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>المسمى الوظيفي</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>القسم</Label><Input value={profile.department ?? ""} disabled /></div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تغيير كلمة المرور</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>كلمة المرور الحالية</Label><Input dir="ltr" type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>كلمة المرور الجديدة</Label><Input dir="ltr" type="password" minLength={8} value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>تأكيد كلمة المرور</Label><Input dir="ltr" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => {
              if (pwd.next !== pwd.confirm) return toast.error("كلمتا المرور غير متطابقتين");
              if (pwd.next.length < 8) return toast.error("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
              pwdMut.mutate();
            }} disabled={pwdMut.isPending}>
              {pwdMut.isPending ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
