import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Wallet, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
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
import { PAYMENT_METHODS, PAYMENT_STATUSES, formatDate, formatEGP, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payments")({ component: PaymentsPage });

function PaymentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["payments", status],
    queryFn: async () => {
      let q = db.from("payments").select("*, clients(company_name)").order("due_date", { ascending: true, nullsFirst: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  const stats = { totalDue: 0, totalPaid: 0, overdue: 0, count: 0 };
  const now = Date.now();
  for (const r of rows ?? []) {
    stats.count++;
    const total = Number(r.total_amount ?? 0);
    const paid = Number(r.paid_amount ?? 0);
    stats.totalDue += Math.max(0, total - paid);
    stats.totalPaid += paid;
    if (r.due_date && new Date(r.due_date).getTime() < now && r.status !== "paid") stats.overdue++;
  }

  return (
    <div>
      <PageHeader
        title="التحصيلات والمدفوعات"
        description="متابعة الفواتير المستحقة، الدفعات الجزئية، والمبالغ المتأخرة."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {PAYMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> فاتورة جديدة</Button></DialogTrigger>
              <PaymentForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["payments"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي المستحق" value={formatEGP(stats.totalDue)} icon={Wallet} tone="warning" />
        <StatCard label="إجمالي المحصّل" value={formatEGP(stats.totalPaid)} icon={CheckCircle2} tone="success" />
        <StatCard label="فواتير متأخرة" value={stats.overdue} icon={AlertTriangle} tone="primary" />
        <StatCard label="عدد الفواتير" value={stats.count} icon={Clock} tone="primary" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الإجمالي</TableHead>
            <TableHead className="text-right">المدفوع</TableHead>
            <TableHead className="text-right">المتبقي</TableHead>
            <TableHead className="text-right">طريقة الدفع</TableHead>
            <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد فواتير.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => {
              const total = Number(r.total_amount ?? 0);
              const paid = Number(r.paid_amount ?? 0);
              const remaining = Math.max(0, total - paid);
              const overdue = r.due_date && new Date(r.due_date).getTime() < now && r.status !== "paid";
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                  <TableCell>{formatEGP(total)}</TableCell>
                  <TableCell className="text-success">{formatEGP(paid)}</TableCell>
                  <TableCell className={remaining > 0 ? "text-destructive font-medium" : ""}>{formatEGP(remaining)}</TableCell>
                  <TableCell>{labelOf(PAYMENT_METHODS, r.method)}</TableCell>
                  <TableCell className={overdue ? "text-destructive text-xs" : "text-xs text-muted-foreground"}>{formatDate(r.due_date)}</TableCell>
                  <TableCell><Badge variant={r.status === "paid" ? "default" : "secondary"}>{labelOf(PAYMENT_STATUSES, r.status)}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PaymentForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_id: "", total_amount: "", paid_amount: "0", method: "bank_transfer",
    due_date: "", status: "unpaid", notes: "",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const total = Number(form.total_amount || 0);
      const paid = Number(form.paid_amount || 0);
      const status = paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : form.status;
      const { error } = await db.from("payments").insert({
        client_id: form.client_id,
        total_amount: total,
        paid_amount: paid,
        method: form.method,
        due_date: form.due_date || null,
        status,
        notes: form.notes || null,
        created_by: userRes.user?.id,
        collection_owner: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حفظ الفاتورة"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-xl" dir="rtl">
      <DialogHeader><DialogTitle>فاتورة جديدة</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">المبلغ الإجمالي (ج.م) *</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">المدفوع حاليًا (ج.م)</Label><Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">طريقة الدفع</Label>
          <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ الاستحقاق</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || !form.total_amount || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
