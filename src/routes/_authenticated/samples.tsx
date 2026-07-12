import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Package, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type AnyRow } from "@/lib/db-any";
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
import { SAMPLE_STATUSES, SERVICES, formatDate, formatNumber, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/samples")({ component: SamplesPage });

function SamplesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["samples", status],
    queryFn: async () => {
      let q = db.from("samples").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  const stats = { total: 0, in_progress: 0, delivered: 0, approved: 0 };
  for (const r of rows ?? []) {
    stats.total++;
    if (r.status === "requested" || r.status === "in_production" || r.status === "ready") stats.in_progress++;
    if (r.status === "delivered") stats.delivered++;
    if (r.status === "approved") stats.approved++;
  }

  const updateStatus = useMutation({
    mutationFn: async ({ id, s }: { id: string; s: string }) => {
      const patch: AnyRow = { status: s };
      if (s === "delivered") patch.delivered_at = new Date().toISOString().slice(0, 10);
      if (s === "in_production") patch.produced_at = new Date().toISOString().slice(0, 10);
      const { error } = await db.from("samples").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["samples"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="العينات"
        description="طلبات عينات المنتجات — من الطلب حتى الاعتماد النهائي من العميل."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {SAMPLE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> طلب عينة</Button></DialogTrigger>
              <SampleForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["samples"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي العينات" value={formatNumber(stats.total)} icon={Package} tone="primary" />
        <StatCard label="قيد التنفيذ" value={formatNumber(stats.in_progress)} icon={Clock} tone="warning" />
        <StatCard label="تم التسليم" value={formatNumber(stats.delivered)} icon={CheckCircle2} tone="primary" />
        <StatCard label="معتمدة من العميل" value={formatNumber(stats.approved)} icon={CheckCircle2} tone="success" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">الرقم</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الوصف</TableHead>
            <TableHead className="text-right">الخدمة</TableHead>
            <TableHead className="text-right">طُلبت</TableHead>
            <TableHead className="text-right">سُلّمت</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد عينات.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.sample_number ?? String(r.id).slice(0, 8)}</TableCell>
                <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.description ?? "—"}</TableCell>
                <TableCell>{labelOf(SERVICES, r.service_type)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.requested_at)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.delivered_at)}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, s: v })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{SAMPLE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SampleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_id: "", service_type: "digital", product_type: "", description: "",
    status: "requested", notes: "",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const sample_number = `SM-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("samples").insert({
        sample_number,
        client_id: form.client_id,
        service_type: form.service_type,
        product_type: form.product_type || null,
        description: form.description || null,
        status: form.status,
        notes: form.notes || null,
        created_by: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم تسجيل طلب العينة"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-xl" dir="rtl">
      <DialogHeader><DialogTitle>طلب عينة جديد</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الخدمة</Label>
          <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SERVICES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">نوع المنتج</Label><Input value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">وصف العينة</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
