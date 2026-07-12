import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAdminUsers, createAdminUser, updateAdminUser,
  resetUserPassword, deleteAdminUser, listAuditLogs,
} from "@/lib/admin-users.functions";
import { useRoles } from "@/hooks/useRoles";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShieldAlert, UserPlus, KeyRound, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

const DEPARTMENTS = ["الإدارة","التسويق","المبيعات","التسعير","الإنتاج","ضبط الجودة","المالية","خدمة العملاء","الإدارة العامة"];
const ROLES = ["super_admin","top_management","sales_manager","sales_person","marketing_manager","pricing_team","production","production_planning","quality_control","finance","accounting","customer_service","viewer"] as const;

function Denied() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center p-8 rounded-2xl border bg-card">
      <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h1 className="text-xl font-bold mb-2">ليس لديك صلاحية للوصول إلى هذه الصفحة</h1>
      <p className="text-muted-foreground text-sm">هذه الصفحة متاحة فقط لمدير النظام.</p>
    </div>
  );
}

function UsersPage() {
  const { roles, loading } = useRoles();
  if (loading) return null;
  if (!roles.includes("super_admin")) return <Denied />;
  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="المستخدمين والصلاحيات" description="إدارة الحسابات والأدوار وسجل التدقيق" />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="roles">الصلاحيات والأدوار</TabsTrigger>
          <TabsTrigger value="audit">سجل التدقيق</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="pt-4"><UsersTab /></TabsContent>
        <TabsContent value="roles" className="pt-4"><RolesTab /></TabsContent>
        <TabsContent value="audit" className="pt-4"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminUsers);
  const { data: users = [] } = useSuspenseQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const filtered = useMemo(() => {
    return users.filter((u: any) => {
      if (roleFilter !== "all" && !u.roles.includes(roleFilter)) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (u.full_name || "").toLowerCase().includes(q)
          || (u.email || "").toLowerCase().includes(q)
          || (u.phone || "").toLowerCase().includes(q)
          || (u.department || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const deleteFn = useServerFn(deleteAdminUser);
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو البريد أو الهاتف" value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الدور" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
            <SelectItem value="suspended">موقوف</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 ml-2" /> إضافة مستخدم جديد</Button>
          </DialogTrigger>
          <UserFormDialog mode="create" onDone={() => setCreateOpen(false)} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد نتائج</TableCell></TableRow>
              )}
              {filtered.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name || "—"}
                    {u.is_owner && <Badge variant="secondary" className="mr-2">المالك</Badge>}
                  </TableCell>
                  <TableCell dir="ltr" className="text-xs">{u.email}</TableCell>
                  <TableCell dir="ltr" className="text-xs">{u.phone || "—"}</TableCell>
                  <TableCell>{u.department || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r: string) => <Badge key={r} variant="outline">{ROLE_LABELS[r] || r}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : u.status === "suspended" ? "destructive" : "secondary"}>
                      {u.status === "active" ? "نشط" : u.status === "suspended" ? "موقوف" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("ar-EG") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditUser(u)} title="تعديل"><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setResetUser(u)} title="إعادة تعيين كلمة المرور"><KeyRound className="h-4 w-4" /></Button>
                      {!u.is_owner && (
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(u)} title="حذف">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editUser && (
        <Dialog open onOpenChange={(o) => !o && setEditUser(null)}>
          <UserFormDialog mode="edit" user={editUser} onDone={() => setEditUser(null)} />
        </Dialog>
      )}

      {resetUser && (
        <Dialog open onOpenChange={(o) => !o && setResetUser(null)}>
          <ResetPasswordDialog user={resetUser} onDone={() => setResetUser(null)} />
        </Dialog>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم؟</AlertDialogTitle>
            <AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserFormDialog({ mode, user, onDone }: { mode: "create" | "edit"; user?: any; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    department: user?.department ?? "",
    job_title: user?.job_title ?? "",
    role: user?.roles?.[0] ?? "sales_person",
    password: "",
    status: user?.status ?? "active",
    notes: user?.notes ?? "",
  });
  const createFn = useServerFn(createAdminUser);
  const updateFn = useServerFn(updateAdminUser);
  const mut = useMutation({
    mutationFn: async () => {
      if (mode === "create") return createFn({ data: form as any });
      return updateFn({ data: { id: user.id, ...form } as any });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "تم إنشاء المستخدم" : "تم تحديث المستخدم");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onDone();
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DialogContent className="max-w-2xl" dir="rtl">
      <DialogHeader><DialogTitle>{mode === "create" ? "إضافة مستخدم جديد" : "تعديل المستخدم"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><Input dir="ltr" type="email" disabled={mode === "edit"} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>الهاتف</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>القسم</Label>
          <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
            <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>المسمى الوظيفي</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>الدور</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>الحالة</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === "create" && (
          <div className="space-y-1.5"><Label>كلمة المرور</Label><Input dir="ltr" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        )}
        <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>إلغاء</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "جارٍ الحفظ..." : "حفظ"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ResetPasswordDialog({ user, onDone }: { user: any; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const fn = useServerFn(resetUserPassword);
  const mut = useMutation({
    mutationFn: () => fn({ data: { id: user.id, password, force_change: forceChange } }),
    onSuccess: () => { toast.success("تم تحديث كلمة المرور"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DialogContent dir="rtl">
      <DialogHeader><DialogTitle>إعادة تعيين كلمة المرور</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">للمستخدم: {user.email}</p>
        <div className="space-y-1.5"><Label>كلمة مرور مؤقتة</Label><Input dir="ltr" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>تأكيد كلمة المرور</Label><Input dir="ltr" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <div className="flex items-center gap-2"><Switch checked={forceChange} onCheckedChange={setForceChange} /><Label>إجبار تغيير كلمة المرور عند الدخول</Label></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>إلغاء</Button>
        <Button onClick={() => {
          if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
          if (password.length < 8) return toast.error("كلمة المرور ضعيفة");
          mut.mutate();
        }} disabled={mut.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function RolesTab() {
  return (
    <Card>
      <CardHeader><CardTitle>مصفوفة الأدوار والصلاحيات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          الأدوار الحالية في النظام وصلاحياتها الافتراضية. لتغيير دور مستخدم، استخدم زر التعديل من قائمة المستخدمين.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <Card key={r} className="border">
              <CardHeader className="pb-2"><CardTitle className="text-base">{ROLE_LABELS[r]}</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <code dir="ltr" className="text-[10px]">{r}</code>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-4 border-t">
          صلاحيات الوصول للوحدات محددة في <code dir="ltr">src/lib/permissions.ts</code> — يتم فرضها في الواجهة وأيضًا عبر سياسات RLS في قاعدة البيانات.
        </p>
      </CardContent>
    </Card>
  );
}

function AuditTab() {
  const fn = useServerFn(listAuditLogs);
  const { data = [] } = useQuery({ queryKey: ["audit-logs"], queryFn: () => fn() });
  return (
    <Card>
      <CardHeader><CardTitle>سجل التدقيق (آخر 200 حدث)</CardTitle></CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الحدث</TableHead>
              <TableHead>المستخدم المستهدف</TableHead>
              <TableHead>التفاصيل</TableHead>
              <TableHead>التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">لا توجد سجلات</TableCell></TableRow>}
            {data.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                <TableCell dir="ltr" className="text-xs">{l.target_user || "—"}</TableCell>
                <TableCell dir="ltr" className="text-xs max-w-md truncate">{JSON.stringify(l.details)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("ar-EG")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
