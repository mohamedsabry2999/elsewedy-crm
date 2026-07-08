import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, MessageSquareWarning, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatCard } from "@/components/crm/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COMPLAINT_TYPES, COMPLAINT_STATUSES, COMPLAINT_SEVERITIES, formatDate, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/complaints")({
  component: ComplaintsPage,
});

const severityColor: Record<string, string> = {
  low: "bg-info/10 text-info border-info/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground",
};

function ComplaintsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["complaints", status],
    queryFn: async () => {
      let q = supabase.from("complaints").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status as "open");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = (rows ?? []).reduce(
    (a, r) => {
      if (r.status === "open" || r.status === "investigating") a.open++;
      if (r.status === "resolved" || r.status === "closed") a.resolved++;
      if (r.severity === "critical" || r.severity === "high") a.critical++;
      const ageHrs = (Date.now() - new Date(r.created_at).getTime()) / 36e5;
      if ((r.status === "open" || r.status === "investigating") && ageHrs > 48) a.overdue++;
      return a;
    },
    { open: 0, resolved: 0, critical: 0, overdue: 0 },
  );

  return (
    <div>
      <PageHeader
        title="الشكاوى والجودة"
        description="تسجيل ومتابعة شكاوى العملاء حتى الحل. الشكاوى المفتوحة أكثر من 48 ساعة يتم تصعيدها."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {COMPLAINT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> شكوى جديدة</Button></DialogTrigger>
              <ComplaintForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["complaints"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="مفتوحة" value={stats.open} icon={MessageSquareWarning} tone="warning" />
        <StatCard label="حرجة / عالية" value={stats.critical} icon={AlertTriangle} tone="primary" />
        <StatCard label="متأخرة > 48 ساعة" value={stats.overdue} icon={AlertTriangle} tone="primary" />
        <StatCard label="تم حلها" value={stats.resolved} icon={MessageSquareWarning} tone="success" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الرقم</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">الموضوع</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">الأهمية</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <MessageSquareWarning className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد شكاوى.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.complaint_number ?? r.id.slice(0, 8)}</TableCell>
                <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.subject}</TableCell>
                <TableCell>{labelOf(COMPLAINT_TYPES, r.complaint_type)}</TableCell>
                <TableCell><Badge variant="outline" className={severityColor[r.severity]}>{labelOf(COMPLAINT_SEVERITIES, r.severity)}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{labelOf(COMPLAINT_STATUSES, r.status)}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ComplaintForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_id: "", subject: "", description: "",
    complaint_type: "delay", severity: "medium", status: "open",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const complaint_number = `C-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("complaints").insert({
        complaint_number,
        client_id: form.client_id || null,
        subject: form.subject,
        description: form.description || null,
        complaint_type: form.complaint_type as "delay",
        severity: form.severity as "medium",
        status: form.status as "open",
        created_by: userRes.user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم تسجيل الشكوى"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent className="max-w-xl" dir="rtl">
      <DialogHeader><DialogTitle>شكوى جديدة</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">موضوع الشكوى *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">النوع</Label>
          <Select value={form.complaint_type} onValueChange={(v) => setForm({ ...form, complaint_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COMPLAINT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">درجة الأهمية</Label>
          <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COMPLAINT_SEVERITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">الوصف التفصيلي</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || !form.subject || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
