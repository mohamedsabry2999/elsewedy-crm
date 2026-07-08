import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Megaphone, TrendingUp } from "lucide-react";
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
import {
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_STATUSES,
  SECTORS,
  SERVICES,
  formatEGP,
  formatNumber,
  formatDate,
  labelOf,
} from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = (campaigns ?? []).reduce(
    (acc, c) => {
      acc.budget += Number(c.budget || 0);
      acc.spent += Number(c.spent || 0);
      acc.leads += Number(c.leads_generated || 0);
      acc.revenue += Number(c.revenue || 0);
      return acc;
    },
    { budget: 0, spent: 0, leads: 0, revenue: 0 },
  );
  const cpl = totals.leads > 0 ? totals.spent / totals.leads : 0;
  const roi = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="الحملات التسويقية"
        description="تتبع أداء الحملات، تكلفة العميل المحتمل (CPL) وعائد الاستثمار (ROI)."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> حملة جديدة</Button></DialogTrigger>
            <CampaignForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["campaigns"] })} />
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الميزانية" value={formatEGP(totals.budget)} icon={Megaphone} />
        <StatCard label="المصروف الفعلي" value={formatEGP(totals.spent)} icon={Megaphone} />
        <StatCard label="تكلفة العميل المحتمل" value={formatEGP(cpl)} icon={TrendingUp} />
        <StatCard label="عائد الاستثمار" value={`${roi.toFixed(0)}%`} icon={TrendingUp} trend={roi >= 0 ? "up" : "down"} />

      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم الحملة</TableHead>
              <TableHead className="text-right">المنصة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الميزانية</TableHead>
              <TableHead className="text-right">المصروف</TableHead>
              <TableHead className="text-right">العملاء</TableHead>
              <TableHead className="text-right">الصفقات</TableHead>
              <TableHead className="text-right">CPL</TableHead>
              <TableHead className="text-right">ROI</TableHead>
              <TableHead className="text-right">الفترة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && (campaigns ?? []).length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center py-16 text-muted-foreground">
                <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد حملات بعد.
              </TableCell></TableRow>
            )}
            {(campaigns ?? []).map((c) => {
              const cpl = c.leads_generated ? Number(c.spent) / c.leads_generated : 0;
              const roi = Number(c.spent) > 0 ? ((Number(c.revenue) - Number(c.spent)) / Number(c.spent)) * 100 : 0;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{labelOf(CAMPAIGN_PLATFORMS, c.platform)}</TableCell>
                  <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{labelOf(CAMPAIGN_STATUSES, c.status)}</Badge></TableCell>
                  <TableCell className="ltr-nums">{formatEGP(c.budget)}</TableCell>
                  <TableCell className="ltr-nums">{formatEGP(c.spent)}</TableCell>
                  <TableCell className="ltr-nums">{formatNumber(c.leads_generated)}</TableCell>
                  <TableCell className="ltr-nums">{formatNumber(c.deals_closed)}</TableCell>
                  <TableCell className="ltr-nums">{formatEGP(cpl)}</TableCell>
                  <TableCell className={`ltr-nums font-semibold ${roi >= 0 ? "text-success" : "text-destructive"}`}>{roi.toFixed(0)}%</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(c.start_date)} → {formatDate(c.end_date)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CampaignForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", platform: "meta", status: "planned",
    budget: "", spent: "", leads_generated: "", deals_closed: "", revenue: "",
    start_date: "", end_date: "", target_sector: "", target_service: "", notes: "",
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("campaigns").insert({
        name: form.name,
        platform: form.platform as "meta",
        status: form.status as "planned",
        budget: Number(form.budget || 0),
        spent: Number(form.spent || 0),
        leads_generated: Number(form.leads_generated || 0),
        deals_closed: Number(form.deals_closed || 0),
        revenue: Number(form.revenue || 0),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        target_sector: form.target_sector || null,
        target_service: form.target_service || null,
        notes: form.notes || null,
        owner_id: userRes.user?.id,
        created_by: userRes.user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم إنشاء الحملة"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader><DialogTitle>حملة تسويقية جديدة</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">اسم الحملة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">المنصة</Label>
          <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CAMPAIGN_PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الحالة</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CAMPAIGN_STATUSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الميزانية (جنيه)</Label><Input type="number" dir="ltr" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">المصروف الفعلي</Label><Input type="number" dir="ltr" value={form.spent} onChange={(e) => setForm({ ...form, spent: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">عدد العملاء</Label><Input type="number" dir="ltr" value={form.leads_generated} onChange={(e) => setForm({ ...form, leads_generated: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">صفقات مغلقة</Label><Input type="number" dir="ltr" value={form.deals_closed} onChange={(e) => setForm({ ...form, deals_closed: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">الإيراد المتحقق</Label><Input type="number" dir="ltr" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ البدء</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">تاريخ الانتهاء</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">القطاع المستهدف</Label>
          <Select value={form.target_sector} onValueChange={(v) => setForm({ ...form, target_sector: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{SECTORS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">الخدمة المستهدفة</Label>
          <Select value={form.target_service} onValueChange={(v) => setForm({ ...form, target_service: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{SERVICES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>حفظ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
