import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Plus, Trash2, Printer, Save, Send, CheckCircle2, Package } from "lucide-react";
import { logActivity, notifyRole } from "@/lib/journey";
import { PRODUCTION_STAGE_TEMPLATE } from "@/lib/crm-constants";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUOTATION_STATUSES, formatEGP, labelOf } from "@/lib/crm-constants";
import { printQuotationPDF } from "@/lib/quotation-pdf";
import { ArtworkUploader } from "@/components/artwork/ArtworkUploader";
import { ArtworkList } from "@/components/artwork/ArtworkList";
import { useRoles } from "@/hooks/useRoles";
import { can } from "@/lib/permissions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quotations/$id")({
  component: QuotationDetailPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">العرض غير موجود</div>,
});

type Item = {
  id?: string;
  description: string;
  unit: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  sort_order: number;
  total: number;
};

function QuotationDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quotation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*, clients(company_name, contact_person, phone, email)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: itemsData } = useQuery({
    queryKey: ["quotation-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const [items, setItems] = useState<Item[] | null>(null);
  const [discount, setDiscount] = useState<string>("");
  const [vatRate, setVatRate] = useState<string>("14");
  const [status, setStatus] = useState<string>("");

  // hydrate local state when data loads
  if (itemsData && items === null) setItems(itemsData);
  if (quote && status === "") {
    setStatus(quote.status ?? "draft");
    setDiscount(String(quote.discount ?? 0));
  }

  const rows = items ?? [];
  const subtotal = rows.reduce((s, r) => s + Number(r.total || 0), 0);
  const discountNum = Number(discount || 0);
  const vat = ((subtotal - discountNum) * Number(vatRate || 0)) / 100;
  const final = subtotal - discountNum + vat;

  function updateRow(i: number, patch: Partial<Item>) {
    const next = [...rows];
    const cur = { ...next[i], ...patch };
    const q = Number(cur.quantity || 0);
    const up = Number(cur.unit_price || 0);
    const dp = Number(cur.discount_pct || 0);
    cur.total = q * up * (1 - dp / 100);
    next[i] = cur;
    setItems(next);
  }

  function addRow() {
    setItems([
      ...rows,
      { description: "", unit: "قطعة", quantity: 1, unit_price: 0, discount_pct: 0, sort_order: rows.length, total: 0 },
    ]);
  }

  function removeRow(i: number) {
    setItems(rows.filter((_, idx) => idx !== i));
  }

  const save = useMutation({
    mutationFn: async () => {
      // Replace all items for this quotation atomically-ish
      const { error: delErr } = await supabase.from("quotation_items").delete().eq("quotation_id", id);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const payload = rows.map((r, i) => ({
          quotation_id: id,
          description: r.description,
          unit: r.unit,
          quantity: Number(r.quantity || 0),
          unit_price: Number(r.unit_price || 0),
          discount_pct: Number(r.discount_pct || 0),
          sort_order: i,
          total: Number(r.total || 0),
        }));
        const { error: insErr } = await supabase.from("quotation_items").insert(payload);
        if (insErr) throw insErr;
      }
      const { error: upErr } = await supabase
        .from("quotations")
        .update({
          total_price: subtotal,
          discount: discountNum,
          vat_amount: vat,
          final_price: final,
          status: status as "draft",
        } as never)
        .eq("id", id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      toast.success("تم حفظ العرض");
      qc.invalidateQueries({ queryKey: ["quotation", id] });
      qc.invalidateQueries({ queryKey: ["quotation-items", id] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const transition = useMutation({
    mutationFn: async (next: "sent" | "approved") => {
      const { error } = await supabase.from("quotations")
        .update({ status: next as "sent" } as never).eq("id", id);
      if (error) throw error;
      await logActivity(`quote_${next}`,
        `عرض ${quote?.quote_number} — ${next === "sent" ? "أُرسل للعميل" : "تم اعتماده"}`,
        { client_id: quote?.client_id, deal_id: quote?.deal_id });
      if (next === "approved") {
        await notifyRole("production_planning", "quote_approved",
          "عرض معتمد جاهز للتحويل",
          `${quote?.quote_number} — ${quote?.clients?.company_name ?? ""}`,
          `/quotations/${id}`);
      }
    },
    onSuccess: (_r, next) => {
      toast.success(next === "sent" ? "تم الإرسال" : "تم الاعتماد");
      qc.invalidateQueries({ queryKey: ["quotation", id] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toOrder = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const order_number = `ORD-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase.from("orders").insert({
        order_number,
        client_id: quote?.client_id ?? null,
        quotation_id: id,
        title: `طلب — ${quote?.quote_number}`,
        total_amount: Number(quote?.final_price ?? quote?.total_price ?? 0),
        paid_amount: 0,
        status: "new" as const,
        owner_id: quote?.owner_id ?? u.user?.id,
        created_by: u.user?.id,
      } as never).select("id").single();
      if (error) throw error;
      const stages = PRODUCTION_STAGE_TEMPLATE.map((name, i) => ({
        order_id: data!.id, stage_name: name, stage_order: i, status: "pending" as const,
      }));
      await supabase.from("production_stages").insert(stages as never);
      await logActivity("order_created",
        `تحويل عرض ${quote?.quote_number} إلى طلب ${order_number}`,
        { client_id: quote?.client_id, deal_id: quote?.deal_id });
      await notifyRole("production_planning", "order_created",
        "طلب جديد للإنتاج", order_number, `/production`, { type: "order", id: data!.id });
      if (quote?.deal_id) {
        await supabase.from("deals").update({ stage: "won" as const }).eq("id", quote.deal_id as string);
      }
      return data!.id as string;
    },
    onSuccess: () => {
      toast.success("تم إنشاء الطلب ومراحل الإنتاج");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["quotation", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">جارٍ التحميل...</div>;
  if (!quote) return <div className="p-8">العرض غير موجود</div>;

  return (
    <div>
      <PageHeader
        title={`عرض سعر ${quote.quote_number ?? id.slice(0, 8)}`}
        description={quote.clients?.company_name ?? "بدون عميل"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.history.back()}>
              <ArrowRight className="h-4 w-4 ml-1" /> رجوع
            </Button>
            <Button variant="outline" onClick={() => printQuotationPDF({ ...quote, items: rows } as never)}>
              <Printer className="h-4 w-4 ml-1" /> طباعة / PDF
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="h-4 w-4 ml-1" /> حفظ
            </Button>
            {quote.status === "draft" && (
              <Button variant="secondary" onClick={() => transition.mutate("sent")} disabled={transition.isPending}>
                <Send className="h-4 w-4 ml-1" /> إرسال للعميل
              </Button>
            )}
            {quote.status === "sent" && (
              <Button className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => transition.mutate("approved")} disabled={transition.isPending}>
                <CheckCircle2 className="h-4 w-4 ml-1" /> اعتماد
              </Button>
            )}
            {quote.status === "approved" && (
              <Button onClick={() => toOrder.mutate()} disabled={toOrder.isPending}>
                <Package className="h-4 w-4 ml-1" /> تحويل إلى طلب إنتاج
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card className="p-4 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">بنود العرض</h3>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 ml-1" /> إضافة بند
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[38%]">الوصف</TableHead>
                <TableHead className="text-right">الوحدة</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">سعر الوحدة</TableHead>
                <TableHead className="text-right">خصم %</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد بنود بعد — أضف أول بند.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input value={r.description} onChange={(e) => updateRow(i, { description: e.target.value })} placeholder="اسم المنتج / الخدمة" />
                  </TableCell>
                  <TableCell>
                    <Input value={r.unit ?? ""} onChange={(e) => updateRow(i, { unit: e.target.value })} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" dir="ltr" value={r.quantity} onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" dir="ltr" value={r.unit_price} onChange={(e) => updateRow(i, { unit_price: Number(e.target.value) })} className="w-28" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" dir="ltr" value={r.discount_pct} onChange={(e) => updateRow(i, { discount_pct: Number(e.target.value) })} className="w-20" />
                  </TableCell>
                  <TableCell className="font-semibold text-primary ltr-nums">{formatEGP(r.total)}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => removeRow(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4 shadow-card space-y-3">
          <h3 className="font-semibold">الملخص المالي</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUOTATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">الخصم (ج.م)</Label>
              <Input type="number" dir="ltr" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ض.ق.م %</Label>
              <Input type="number" dir="ltr" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
            </div>
          </div>
          <div className="pt-3 border-t space-y-2 text-sm">
            <Row label="المجموع الفرعي" value={formatEGP(subtotal)} />
            <Row label="الخصم" value={`- ${formatEGP(discountNum)}`} />
            <Row label={`ض.ق.م (${vatRate}%)`} value={formatEGP(vat)} />
            <div className="flex justify-between pt-2 border-t font-bold text-lg text-primary">
              <span>الإجمالي النهائي</span>
              <span className="ltr-nums">{formatEGP(final)}</span>
            </div>
          </div>
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-1">الحالة الحالية</div>
            <Badge variant="secondary">{labelOf(QUOTATION_STATUSES, quote.status)}</Badge>
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            <Link to="/quotations" className="underline">العودة لقائمة العروض</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium ltr-nums">{value}</span>
    </div>
  );
}
