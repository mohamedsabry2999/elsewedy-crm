import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Package } from "lucide-react";
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
import { ORDER_STATUSES, PRODUCTION_STAGE_TEMPLATE, formatEGP, formatDate, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["orders", status],
    queryFn: async () => {
      let q = supabase.from("orders").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status as "new");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = (rows ?? []).reduce(
    (a, r) => {
      a.count++;
      a.value += Number(r.total_amount || 0);
      a.paid += Number(r.paid_amount || 0);
      if (["in_production", "quality_check", "packaging"].includes(r.status)) a.active++;
      return a;
    },
    { count: 0, value: 0, paid: 0, active: 0 },
  );

  return (
    <div>
      <PageHeader
        title="الطلبات"
        description="تتبع الطلبات من الاعتماد حتى التسليم، ومراقبة السداد."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {ORDER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> طلب جديد</Button></DialogTrigger>
              <OrderForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["orders"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الطلبات" value={totals.count} icon={Package} />
        <StatCard label="قيمة الطلبات" value={formatEGP(totals.value)} icon={Package} tone="primary" />
        <StatCard label="المحصّل" value={formatEGP(totals.paid)} icon={Package} tone="success" />
        <StatCard label="قيد الإنتاج" value={totals.active} icon={Package} tone="warning" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الطلب</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">القيمة</TableHead>
              <TableHead className="text-right">المسدد</TableHead>
              <TableHead className="text-right">التسليم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد طلبات بعد.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.order_number ?? r.id.slice(0, 8)}</TableCell>
                <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell className="ltr-nums font-semibold text-primary">{formatEGP(r.total_amount)}</TableCell>
                <TableCell className="ltr-nums">{formatEGP(r.paid_amount)}</TableCell>
                <TableCell>{formatDate(r.delivery_date)}</TableCell>
                <TableCell><Badge variant="secondary">{labelOf(ORDER_STATUSES, r.status)}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrderForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    client_id: "", quotation_id: "", title: "",
    total_amount: "", paid_amount: "", delivery_date: "",
    status: "new", delivery_address: "", production_notes: "",
    create_stages: true,
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const { data: quotes } = useQuery({
    queryKey: ["quotes-approved"],
    queryFn: async () => (await supabase.from("quotations").select("id, quote_number, client_id, total_price").eq("status", "approved")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const order_number = `ORD-${Date.now().toString().slice(-6)}`;
      const { data: inserted, error } = await supabase.from("orders").insert({
        order_number,
        client_id: form.client_id || null,
        quotation_id: form.quotation_id || null,
        title: form.title,
        total_amount: Number(form.total_amount || 0),
        paid_amount: Number(form.paid_amount || 0),
        delivery_date: form.delivery_date || null,
        status: form.status as "new",
        delivery_address: form.delivery_address || null,
        production_notes: form.production_notes || null,
        owner_id: userRes.user?.id,
        created_by: userRes.user?.id,
      } as never).select("id").single();
      if (error) throw error;
      if (form.create_stages && inserted?.id) {
        const stages = PRODUCTION_STAGE_TEMPLATE.map((name, i) => ({
          order_id: inserted.id, stage_name: name, stage_order: i, status: "pending" as const,
        }));
        await supabase.from("production_stages").insert(stages as never);
      }
    },
    onSuccess: () => { toast.success("تم إنشاء الطلب"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader><DialogTitle>طلب إنتاج جديد</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">من عرض سعر</Label>
          <Select value={form.quotation_id} onValueChange={(v) => {
            const q = quotes?.find((x) => x.id === v);
            setForm({ ...form, quotation_id: v, client_id: q?.client_id ?? form.client_id, total_amount: String(q?.total_price ?? form.total_amount) });
          }}>
            <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
            <SelectContent>{(quotes ?? []).map((q) => <SelectItem key={q.id} value={q.id}>{q.quote_number}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">وصف الطلب *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">إجمالي القيمة</Label><Input type="number" dir="ltr" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">المسدد</Label><Input type="number" dir="ltr" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ التسليم</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الحالة</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">عنوان التسليم</Label><Input value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات الإنتاج</Label><Textarea rows={2} value={form.production_notes} onChange={(e) => setForm({ ...form, production_notes: e.target.value })} /></div>
        <label className="md:col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.create_stages} onChange={(e) => setForm({ ...form, create_stages: e.target.checked })} />
          إنشاء مراحل الإنتاج الافتراضية تلقائياً
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || !form.title || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
