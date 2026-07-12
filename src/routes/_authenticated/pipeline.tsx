import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEAL_STAGES, SERVICES, TEMPERATURES, formatEGP, formatDate, labelOf } from "@/lib/crm-constants";
import { Plus, Calculator, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db-any";
import { logActivity, notifyRole } from "@/lib/journey";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
});

const VISIBLE_STAGES = DEAL_STAGES.filter((s) => !["dormant", "reorder"].includes(s.value));

function PipelinePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: deals } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const moveStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("deals").update({ stage: stage as "won" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const byStage = (stage: string) => (deals ?? []).filter((d) => d.stage === stage);

  return (
    <div>
      <PageHeader
        title="خط أنابيب المبيعات"
        description="اسحب الصفقات بين المراحل لتحديث الحالة. القيمة الإجمالية محسوبة تلقائيًا."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> صفقة جديدة</Button></DialogTrigger>
            <DealForm onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {VISIBLE_STAGES.map((stage) => {
            const stageDeals = byStage(stage.value);
            const total = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
            const isWon = stage.value === "won";
            const isLost = stage.value === "lost";
            return (
              <div
                key={stage.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveStage.mutate({ id: dragId, stage: stage.value });
                  setDragId(null);
                }}
                className="w-72 shrink-0"
              >
                <div className={cn(
                  "rounded-t-lg px-3 py-2.5 flex items-center justify-between text-xs font-semibold border-b-2",
                  isWon ? "bg-success/10 text-success border-success" :
                  isLost ? "bg-destructive/10 text-destructive border-destructive" :
                  "bg-muted text-foreground border-primary"
                )}>
                  <span>{stage.label}</span>
                  <span className="ltr-nums">{stageDeals.length}</span>
                </div>
                <div className="bg-muted/30 rounded-b-lg p-2 min-h-[300px] space-y-2">
                  <div className="text-[10px] text-muted-foreground text-center ltr-nums pb-1">{formatEGP(total)}</div>
                  {stageDeals.map((d) => {
                    const temp = TEMPERATURES.find((t) => t.value === d.temperature);
                    return (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={() => setDragId(d.id)}
                        className="bg-card rounded-md p-3 shadow-card cursor-move hover:shadow-elegant transition-shadow border border-border"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold truncate">{d.title}</p>
                          {temp && <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", temp.color)}>{temp.label}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mb-2">{d.clients?.company_name ?? "بلا عميل"}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-primary ltr-nums">{formatEGP(d.value)}</span>
                          <span className="text-[10px] text-muted-foreground">{labelOf(SERVICES, d.service)}</span>
                        </div>
                        {d.next_followup_date && (
                          <div className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border">
                            متابعة: {formatDate(d.next_followup_date)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {stageDeals.length === 0 && (
                    <div className="text-[11px] text-muted-foreground text-center py-8">لا صفقات</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  function DealForm({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
      title: "", service: "digital", value: "", stage: "new_lead", temperature: "warm",
      client_id: "", next_followup_date: "",
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
        const payload = {
          title: form.title,
          service: form.service,
          value: Number(form.value || 0),
          stage: form.stage as "new_lead",
          temperature: form.temperature as "warm",
          client_id: form.client_id || null,
          next_followup_date: form.next_followup_date || null,
          owner_id: userRes.user?.id,
          created_by: userRes.user?.id,
        };
        const { error } = await supabase.from("deals").insert(payload as never);
        if (error) throw error;
      },
      onSuccess: () => { toast.success("تمت إضافة الصفقة"); qc.invalidateQueries({ queryKey: ["deals"] }); onClose(); },
      onError: (e: Error) => toast.error(e.message),
    });
    return (
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>صفقة جديدة</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">عنوان الصفقة *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر عميلاً" /></SelectTrigger>
              <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">الخدمة</Label>
            <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SERVICES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">القيمة (EGP)</Label><Input type="number" dir="ltr" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">المرحلة</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VISIBLE_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">الحرارة</Label>
            <Select value={form.temperature} onValueChange={(v) => setForm({ ...form, temperature: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TEMPERATURES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">موعد المتابعة</Label><Input type="date" value={form.next_followup_date} onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    );
  }
}
