import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type AnyRow } from "@/lib/db-any";
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
import { MEETING_TYPES, formatDate, formatEGP, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meetings")({ component: MeetingsPage });

function MeetingsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["meeting_reports"],
    queryFn: async () => {
      const { data, error } = await db.from("meeting_reports").select("*, clients(company_name)").order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  return (
    <div>
      <PageHeader
        title="تقارير الاجتماعات والزيارات"
        description="وثّق كل زيارة أو اجتماع مع العميل: الاحتياج، الميزانية، وخطوة المتابعة التالية."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> تقرير جديد</Button></DialogTrigger>
            <MeetingForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["meeting_reports"] })} />
          </Dialog>
        }
      />

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">التاريخ</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">الغرض</TableHead>
            <TableHead className="text-right">الميزانية</TableHead>
            <TableHead className="text-right">الاحتمالية</TableHead>
            <TableHead className="text-right">المتابعة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد تقارير اجتماعات.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{formatDate(r.meeting_date)}</TableCell>
                <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{labelOf(MEETING_TYPES, r.meeting_type)}</Badge></TableCell>
                <TableCell className="text-sm max-w-xs truncate">{r.purpose ?? "—"}</TableCell>
                <TableCell>{r.budget ? formatEGP(r.budget) : "—"}</TableCell>
                <TableCell>{r.probability != null ? `${r.probability}%` : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.next_followup)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MeetingForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_id: "", meeting_date: new Date().toISOString().slice(0, 10), meeting_type: "followup",
    purpose: "", client_needs: "", discussed_services: "", competitors_mentioned: "",
    budget: "", probability: "50", next_action: "", next_followup: "", notes: "",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await db.from("meeting_reports").insert({
        client_id: form.client_id,
        meeting_date: form.meeting_date,
        meeting_type: form.meeting_type,
        purpose: form.purpose || null,
        client_needs: form.client_needs || null,
        discussed_services: form.discussed_services || null,
        competitors_mentioned: form.competitors_mentioned || null,
        budget: form.budget ? Number(form.budget) : null,
        probability: form.probability ? Number(form.probability) : null,
        next_action: form.next_action || null,
        next_followup: form.next_followup || null,
        notes: form.notes || null,
        sales_owner: userRes.user?.id,
        created_by: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حفظ التقرير"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader><DialogTitle>تقرير اجتماع / زيارة</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ الاجتماع</Label><Input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">نوع الاجتماع</Label>
          <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MEETING_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">الغرض</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">احتياج العميل</Label><Textarea rows={2} value={form.client_needs} onChange={(e) => setForm({ ...form, client_needs: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الخدمات التي تمت مناقشتها</Label><Input value={form.discussed_services} onChange={(e) => setForm({ ...form, discussed_services: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">منافسون مذكورون</Label><Input value={form.competitors_mentioned} onChange={(e) => setForm({ ...form, competitors_mentioned: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الميزانية (ج.م)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">احتمالية الإغلاق %</Label><Input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الخطوة التالية</Label><Input value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ المتابعة القادم</Label><Input type="date" value={form.next_followup} onChange={(e) => setForm({ ...form, next_followup: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات إضافية</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
