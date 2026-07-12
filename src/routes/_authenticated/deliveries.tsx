import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
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
import { DELIVERY_METHODS, DELIVERY_STATUSES, formatDate, formatNumber, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/deliveries")({ component: DeliveriesPage });

function DeliveriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["deliveries", status],
    queryFn: async () => {
      let q = db.from("deliveries").select("*, clients(company_name), orders(order_number)").order("scheduled_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  const stats = { total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 };
  for (const r of rows ?? []) {
    stats.total++;
    if (r.status === "pending" || r.status === "scheduled") stats.pending++;
    if (r.status === "in_transit") stats.in_transit++;
    if (r.status === "delivered") stats.delivered++;
    if (r.status === "failed" || r.status === "returned") stats.failed++;
  }

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const patch: AnyRow = { status: newStatus };
      if (newStatus === "delivered") patch.delivered_at = new Date().toISOString();
      const { error } = await db.from("deliveries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["deliveries"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="التسليمات والنقل"
        description="جدولة التسليمات، تتبع السائقين، وتوثيق إثبات التسليم."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {DELIVERY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> جدولة تسليم</Button></DialogTrigger>
              <DeliveryForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["deliveries"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="مجدولة / بانتظار" value={formatNumber(stats.pending)} icon={Clock} tone="warning" />
        <StatCard label="في الطريق" value={formatNumber(stats.in_transit)} icon={Truck} tone="primary" />
        <StatCard label="تم التسليم" value={formatNumber(stats.delivered)} icon={CheckCircle2} tone="success" />
        <StatCard label="فشل / مرتجع" value={formatNumber(stats.failed)} icon={XCircle} tone="primary" />
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">الرقم</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الطلب</TableHead>
            <TableHead className="text-right">العنوان</TableHead>
            <TableHead className="text-right">وسيلة النقل</TableHead>
            <TableHead className="text-right">السائق</TableHead>
            <TableHead className="text-right">المجدول</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                <Truck className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد تسليمات مجدولة.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.delivery_number ?? String(r.id).slice(0, 8)}</TableCell>
                <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell className="text-xs">{r.orders?.order_number ?? "—"}</TableCell>
                <TableCell className="text-xs">{[r.address, r.city].filter(Boolean).join("، ") || "—"}</TableCell>
                <TableCell>{labelOf(DELIVERY_METHODS, r.method)}</TableCell>
                <TableCell>{r.driver ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.scheduled_at)}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, newStatus: v })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{DELIVERY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
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

function DeliveryForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    order_id: "", client_id: "", contact_name: "", phone: "", address: "", city: "",
    method: "own_fleet", scheduled_at: "", driver: "", notes: "", status: "scheduled",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const { data: orders } = useQuery({
    queryKey: ["orders-select"],
    queryFn: async () => (await supabase.from("orders").select("id, order_number").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const delivery_number = `DL-${Date.now().toString().slice(-6)}`;
      const { error } = await db.from("deliveries").insert({
        delivery_number,
        client_id: form.client_id || null,
        order_id: form.order_id || null,
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        method: form.method,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        driver: form.driver || null,
        notes: form.notes || null,
        status: form.status,
        created_by: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم جدولة التسليم"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader><DialogTitle>جدولة تسليم جديد</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">الطلب</Label>
          <Select value={form.order_id} onValueChange={(v) => setForm({ ...form, order_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر (اختياري)" /></SelectTrigger>
            <SelectContent>{(orders ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.order_number ?? o.id.slice(0,8)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">جهة الاتصال</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">المدينة</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">وسيلة النقل</Label>
          <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DELIVERY_METHODS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">موعد التسليم</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">السائق</Label><Input value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.client_id || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
