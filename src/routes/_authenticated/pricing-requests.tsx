import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Calculator, Clock, CheckCircle2, AlertTriangle, DollarSign, FileText } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { logActivity, notifyRole } from "@/lib/journey";
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
import {
  PRICING_REQUEST_STATUSES, URGENCY_LEVELS, SERVICES,
  formatDate, formatEGP, formatNumber, labelOf,
} from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pricing-requests")({
  component: PricingRequestsPage,
});

function PricingRequestsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["pricing_requests", status],
    queryFn: async () => {
      let q = db.from("pricing_requests").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  const stats = { total: 0, pending: 0, completed: 0, urgent: 0 };
  for (const r of rows ?? []) {
    stats.total++;
    if (r.status === "submitted" || r.status === "in_review") stats.pending++;
    if (r.status === "priced" || r.status === "approved") stats.completed++;
    if (r.urgency === "high" || r.urgency === "critical") stats.urgent++;
  }

  return (
    <div>
      <PageHeader
        title="طلبات التسعير"
        description="طلبات المبيعات لفريق التسعير — سجّل المتطلبات الفنية واحصل على السعر النهائي."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {PRICING_REQUEST_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> طلب تسعير جديد</Button></DialogTrigger>
              <PricingForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["pricing_requests"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الطلبات" value={formatNumber(stats.total)} icon={Calculator} tone="primary" />
        <StatCard label="بانتظار التسعير" value={formatNumber(stats.pending)} icon={Clock} tone="warning" />
        <StatCard label="عاجل / طارئ" value={formatNumber(stats.urgent)} icon={AlertTriangle} tone="primary" />
        <StatCard label="تم تسعيرها" value={formatNumber(stats.completed)} icon={CheckCircle2} tone="success" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">الرقم</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الخدمة</TableHead>
            <TableHead className="text-right">الكمية</TableHead>
            <TableHead className="text-right">تاريخ التسليم</TableHead>
            <TableHead className="text-right">الأولوية</TableHead>
            <TableHead className="text-right">السعر</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">أُنشئ</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                <Calculator className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد طلبات تسعير.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.request_number ?? String(r.id).slice(0, 8)}</TableCell>
                <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{labelOf(SERVICES, r.service_type)}</TableCell>
                <TableCell>{r.quantity ? formatNumber(r.quantity) : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.delivery_date)}</TableCell>
                <TableCell><Badge variant="outline">{labelOf(URGENCY_LEVELS, r.urgency ?? "normal")}</Badge></TableCell>
                <TableCell>{r.final_price ? formatEGP(r.final_price) : "—"}</TableCell>
                <TableCell><Badge variant="secondary">{labelOf(PRICING_REQUEST_STATUSES, r.status)}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PricingForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_id: "", service_type: "digital", product_type: "", printing_type: "", size: "",
    quantity: "", material: "", colors: "", finishing: "", delivery_date: "",
    urgency: "normal", technical_notes: "", status: "submitted",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const request_number = `PR-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("pricing_requests").insert({
        request_number,
        client_id: form.client_id || null,
        service_type: form.service_type,
        product_type: form.product_type || null,
        printing_type: form.printing_type || null,
        size: form.size || null,
        quantity: form.quantity ? Number(form.quantity) : null,
        material: form.material || null,
        colors: form.colors || null,
        finishing: form.finishing || null,
        delivery_date: form.delivery_date || null,
        urgency: form.urgency,
        technical_notes: form.technical_notes || null,
        status: form.status,
        sales_owner: userRes.user?.id,
        created_by: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم تسجيل طلب التسعير"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader><DialogTitle>طلب تسعير جديد</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الخدمة *</Label>
          <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SERVICES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">نوع المنتج</Label><Input value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })} placeholder="كتالوج / علبة / بروشور..." /></div>
        <div className="space-y-1.5"><Label className="text-xs">نوع الطباعة</Label><Input value={form.printing_type} onChange={(e) => setForm({ ...form, printing_type: e.target.value })} placeholder="أوفست / ديجيتال" /></div>
        <div className="space-y-1.5"><Label className="text-xs">المقاس</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="A4 / 20×30 سم" /></div>
        <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الألوان</Label><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="4/4" /></div>
        <div className="space-y-1.5"><Label className="text-xs">الخامة</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="كوشيه 300 جم" /></div>
        <div className="space-y-1.5"><Label className="text-xs">التشطيبات</Label><Input value={form.finishing} onChange={(e) => setForm({ ...form, finishing: e.target.value })} placeholder="سلوفان / UV" /></div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ التسليم</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الأولوية</Label>
          <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{URGENCY_LEVELS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات فنية</Label><Textarea rows={3} value={form.technical_notes} onChange={(e) => setForm({ ...form, technical_notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || create.isPending}>حفظ وإرسال</Button>
      </DialogFooter>
    </DialogContent>
  );
}
