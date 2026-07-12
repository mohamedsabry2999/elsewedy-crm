import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type AnyRow } from "@/lib/db-any";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatCard } from "@/components/crm/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPROVAL_TYPES, APPROVAL_STATUSES, formatDate, formatNumber, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/approvals")({ component: ApprovalsPage });

function ApprovalsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["approvals", status],
    queryFn: async () => {
      let q = db.from("approvals").select("*").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const r of rows ?? []) {
    stats.total++;
    if (r.status === "pending") stats.pending++;
    if (r.status === "approved") stats.approved++;
    if (r.status === "rejected") stats.rejected++;
  }

  const decide = useMutation({
    mutationFn: async ({ id, s }: { id: string; s: string }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await db.from("approvals").update({
        status: s, approver: userRes.user?.id, decided_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم اتخاذ القرار"); qc.invalidateQueries({ queryKey: ["approvals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="الاعتمادات"
        description="طلبات اعتماد الخصومات الاستثنائية، الحدود الائتمانية، والحالات التي تحتاج موافقة الإدارة."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {APPROVAL_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> طلب اعتماد</Button></DialogTrigger>
              <ApprovalForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["approvals"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الطلبات" value={formatNumber(stats.total)} icon={ShieldCheck} tone="primary" />
        <StatCard label="بانتظار القرار" value={formatNumber(stats.pending)} icon={Clock} tone="warning" />
        <StatCard label="معتمدة" value={formatNumber(stats.approved)} icon={CheckCircle2} tone="success" />
        <StatCard label="مرفوضة" value={formatNumber(stats.rejected)} icon={XCircle} tone="primary" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">السبب</TableHead>
            <TableHead className="text-right">أُنشئ</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الإجراء</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد طلبات اعتماد.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{labelOf(APPROVAL_TYPES, r.request_type)}</TableCell>
                <TableCell className="text-sm">{r.reason ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                <TableCell><Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{labelOf(APPROVAL_STATUSES, r.status)}</Badge></TableCell>
                <TableCell>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => decide.mutate({ id: r.id, s: "approved" })}>اعتماد</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => decide.mutate({ id: r.id, s: "rejected" })}>رفض</Button>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ApprovalForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ request_type: "discount", reason: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await db.from("approvals").insert({
        request_type: form.request_type,
        reason: form.reason || null,
        requested_by: userRes.user?.id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم إرسال طلب الاعتماد"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-md" dir="rtl">
      <DialogHeader><DialogTitle>طلب اعتماد جديد</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5"><Label className="text-xs">نوع الاعتماد</Label>
          <Select value={form.request_type} onValueChange={(v) => setForm({ ...form, request_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{APPROVAL_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">السبب / التبرير *</Label><Textarea rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.reason || create.isPending}>إرسال</Button>
      </DialogFooter>
    </DialogContent>
  );
}
