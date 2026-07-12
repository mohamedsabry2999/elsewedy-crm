import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type AnyRow } from "@/lib/db-any";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatEGP } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/competitors")({ component: CompetitorsPage });

function CompetitorsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["competitors"],
    queryFn: async () => {
      const { data, error } = await db.from("competitors").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  return (
    <div>
      <PageHeader
        title="المنافسون"
        description="سجل كل مرة يقارنك فيها العميل بمنافس — السعر، الميزة، والسبب — لتحسين استراتيجيتك."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> تسجيل مقارنة</Button></DialogTrigger>
            <CompetitorForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["competitors"] })} />
          </Dialog>
        }
      />

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">المنافس</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الخدمة</TableHead>
            <TableHead className="text-right">سعر المنافس</TableHead>
            <TableHead className="text-right">الميزة / السبب</TableHead>
            <TableHead className="text-right">النتيجة</TableHead>
            <TableHead className="text-right">التاريخ</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                <Swords className="h-10 w-10 mx-auto mb-3 opacity-50" /> لم يتم تسجيل أي مقارنة بعد.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.service ?? "—"}</TableCell>
                <TableCell>{r.competitor_price ? formatEGP(r.competitor_price) : "—"}</TableCell>
                <TableCell className="text-sm max-w-xs truncate">{[r.advantage, r.reason].filter(Boolean).join(" — ") || "—"}</TableCell>
                <TableCell className="text-sm">{r.outcome ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CompetitorForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", client_id: "", service: "", competitor_price: "", advantage: "", reason: "", outcome: "", notes: "",
  });
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await db.from("competitors").insert({
        name: form.name,
        client_id: form.client_id || null,
        service: form.service || null,
        competitor_price: form.competitor_price ? Number(form.competitor_price) : null,
        advantage: form.advantage || null,
        reason: form.reason || null,
        outcome: form.outcome || null,
        notes: form.notes || null,
        created_by: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم التسجيل"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-xl" dir="rtl">
      <DialogHeader><DialogTitle>تسجيل مقارنة تنافسية</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="space-y-1.5"><Label className="text-xs">اسم المنافس *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الخدمة موضع المقارنة</Label><Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">سعر المنافس (ج.م)</Label><Input type="number" value={form.competitor_price} onChange={(e) => setForm({ ...form, competitor_price: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ميزته الأساسية</Label><Input value={form.advantage} onChange={(e) => setForm({ ...form, advantage: e.target.value })} placeholder="أرخص / أسرع / جودة أعلى..." /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">سبب المقارنة / تعليق العميل</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">النتيجة النهائية</Label><Input value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="ربحنا / خسرنا / لا يزال" /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
