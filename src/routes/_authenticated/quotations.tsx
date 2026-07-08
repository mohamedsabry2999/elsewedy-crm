import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, FileText, Printer, Pencil } from "lucide-react";
import { printQuotationPDF } from "@/lib/quotation-pdf";


import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUOTATION_STATUSES, SERVICES, formatEGP, formatDate, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quotations")({
  component: QuotationsPage,
});

function QuotationsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("all");

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quotations", status],
    queryFn: async () => {
      let q = supabase.from("quotations").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status as "draft");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="عروض الأسعار"
        description="إنشاء ومتابعة عروض الأسعار من المسودة حتى الاعتماد."
        actions={
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {QUOTATION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> عرض سعر جديد</Button></DialogTrigger>
              <QuoteForm onClose={() => setOpen(false)} />
            </Dialog>
          </div>
        }
      />

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم العرض</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">الخدمة</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right">القيمة الإجمالية</TableHead>
              <TableHead className="text-right">تاريخ التسليم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (quotes ?? []).length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                لا توجد عروض أسعار بعد.
              </TableCell></TableRow>
            )}
            {(quotes ?? []).map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-mono text-xs">{q.quote_number ?? q.id.slice(0, 8)}</TableCell>
                <TableCell className="font-medium">{q.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{labelOf(SERVICES, q.service_type)}</TableCell>
                <TableCell className="ltr-nums">{q.quantity ?? "—"}</TableCell>
                <TableCell className="font-semibold text-primary ltr-nums">{formatEGP(q.total_price)}</TableCell>
                <TableCell>{formatDate(q.delivery_date)}</TableCell>
                <TableCell><Badge variant="secondary">{labelOf(QUOTATION_STATUSES, q.status)}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => printQuotationPDF(q)}>
                    <Printer className="h-3.5 w-3.5" /> PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </Card>
    </div>
  );

  function QuoteForm({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
      client_id: "", service_type: "digital", printing_type: "digital",
      quantity: "", size: "", material: "", colors: "",
      unit_price: "", total_price: "", delivery_date: "",
      technical_notes: "", status: "draft",
    });
    const { data: clients } = useQuery({
      queryKey: ["clients-select"],
      queryFn: async () => {
        const { data } = await supabase.from("clients").select("id, company_name").order("company_name");
        return data ?? [];
      },
    });
    const create = useMutation({
      mutationFn: async () => {
        const { data: userRes } = await supabase.auth.getUser();
        const quote_number = `Q-${Date.now().toString().slice(-6)}`;
        const { error } = await supabase.from("quotations").insert({
          quote_number,
          client_id: form.client_id || null,
          service_type: form.service_type,
          printing_type: form.printing_type,
          quantity: form.quantity ? Number(form.quantity) : null,
          size: form.size, material: form.material, colors: form.colors,
          unit_price: form.unit_price ? Number(form.unit_price) : null,
          total_price: form.total_price ? Number(form.total_price) : null,
          delivery_date: form.delivery_date || null,
          technical_notes: form.technical_notes,
          status: form.status as "draft",
          owner_id: userRes.user?.id,
          created_by: userRes.user?.id,
        } as never);
        if (error) throw error;
      },
      onSuccess: () => { toast.success("تم إنشاء عرض السعر"); qc.invalidateQueries({ queryKey: ["quotations"] }); onClose(); },
      onError: (e: Error) => toast.error(e.message),
    });
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle>عرض سعر جديد</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العميل *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر عميلاً" /></SelectTrigger>
              <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">نوع الخدمة</Label>
            <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SERVICES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">نوع الطباعة</Label>
            <Select value={form.printing_type} onValueChange={(v) => setForm({ ...form, printing_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digital">ديجيتال</SelectItem>
                <SelectItem value="offset">أوفست</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" dir="ltr" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">المقاس</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">الخامة</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">الألوان</Label><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="4+0, 4+4..." /></div>
          <div className="space-y-1.5"><Label className="text-xs">سعر الوحدة</Label><Input type="number" dir="ltr" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">القيمة الإجمالية</Label><Input type="number" dir="ltr" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">تاريخ التسليم</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">الحالة</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{QUOTATION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات فنية</Label><Textarea rows={3} value={form.technical_notes} onChange={(e) => setForm({ ...form, technical_notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => create.mutate()} disabled={!form.client_id || create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    );
  }
}
