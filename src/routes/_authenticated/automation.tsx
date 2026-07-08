import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Zap, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUTOMATION_TRIGGERS, AUTOMATION_ACTIONS, labelOf, formatDate } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automation")({
  component: AutomationPage,
});

function AutomationPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows, isLoading } = useQuery({
    queryKey: ["automation_rules"],
    queryFn: async () => (await supabase.from("automation_rules").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const toggle = async (id: string, status: string) => {
    const next = status === "active" ? "paused" : "active";
    const { error } = await supabase.from("automation_rules").update({ status: next } as never).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["automation_rules"] });
    }
  };

  return (
    <div>
      <PageHeader
        title="الأتمتة"
        description="قواعد ذكية تعمل تلقائياً — إنشاء مهام، إشعارات، وتغيير مراحل الصفقات."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> قاعدة جديدة</Button></DialogTrigger>
            <RuleForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["automation_rules"] })} />
          </Dialog>
        }
      />

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">شرط التشغيل</TableHead>
              <TableHead className="text-right">الإجراء</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">آخر تنفيذ</TableHead>
              <TableHead className="text-right">تنفيذات</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                لا توجد قواعد بعد. أنشئ أول قاعدة لأتمتة سير العمل.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-xs">{labelOf(AUTOMATION_TRIGGERS, r.trigger_type)}</TableCell>
                <TableCell className="text-xs">{labelOf(AUTOMATION_ACTIONS, r.action_type)}</TableCell>
                <TableCell><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status === "active" ? "نشطة" : r.status === "paused" ? "متوقفة" : "مسودة"}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.last_run_at ? formatDate(r.last_run_at) : "لم تنفّذ"}</TableCell>
                <TableCell className="ltr-nums">{r.run_count}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => toggle(r.id, r.status)}>
                    {r.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        💡 القواعد تُشغَّل عبر مهمة مجدولة كل ساعة. سيتم تفعيل التنفيذ التلقائي عند ربط WhatsApp API والبريد الإلكتروني.
      </p>
    </div>
  );
}

function RuleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", description: "",
    trigger_type: "no_followup_3d", action_type: "create_task",
    action_task_title: "متابعة العميل", status: "active",
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("automation_rules").insert({
        name: form.name,
        description: form.description || null,
        trigger_type: form.trigger_type,
        trigger_config: {},
        action_type: form.action_type,
        action_config: form.action_type === "create_task" ? { title: form.action_task_title } : {},
        status: form.status as "active",
        created_by: userRes.user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم إنشاء القاعدة"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent className="max-w-lg" dir="rtl">
      <DialogHeader><DialogTitle>قاعدة أتمتة جديدة</DialogTitle></DialogHeader>
      <div className="grid gap-3 py-2">
        <div className="space-y-1.5"><Label className="text-xs">اسم القاعدة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الوصف</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">شرط التشغيل</Label>
          <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{AUTOMATION_TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الإجراء</Label>
          <Select value={form.action_type} onValueChange={(v) => setForm({ ...form, action_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{AUTOMATION_ACTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {form.action_type === "create_task" && (
          <div className="space-y-1.5"><Label className="text-xs">عنوان المهمة</Label><Input value={form.action_task_title} onChange={(e) => setForm({ ...form, action_task_title: e.target.value })} /></div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
