import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Check, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES, formatDate, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("today");

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("tasks").update({
        status: done ? "completed" : "pending",
        completed_at: done ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const buckets = {
    overdue: (tasks ?? []).filter((t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < now && !t.due_date.startsWith(today)),
    today: (tasks ?? []).filter((t) => t.status !== "completed" && t.due_date && t.due_date.startsWith(today)),
    upcoming: (tasks ?? []).filter((t) => t.status !== "completed" && t.due_date && new Date(t.due_date) > now && !t.due_date.startsWith(today)),
    completed: (tasks ?? []).filter((t) => t.status === "completed"),
  };

  return (
    <div>
      <PageHeader
        title="المهام والمتابعات"
        description="إدارة كل المتابعات المرتبطة بالعملاء المحتملين والصفقات."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> مهمة جديدة</Button></DialogTrigger>
            <TaskForm onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 max-w-xl">
          <TabsTrigger value="today" className="gap-2">اليوم <Badge variant="secondary" className="ltr-nums">{buckets.today.length}</Badge></TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2 data-[state=active]:text-destructive">متأخرة <Badge variant="destructive" className="ltr-nums">{buckets.overdue.length}</Badge></TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">قادمة <Badge variant="secondary" className="ltr-nums">{buckets.upcoming.length}</Badge></TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">مكتملة <Badge variant="secondary" className="ltr-nums">{buckets.completed.length}</Badge></TabsTrigger>
        </TabsList>

        {(["today", "overdue", "upcoming", "completed"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <TaskList tasks={buckets[k]} onToggle={(id, done) => toggle.mutate({ id, done })} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  function TaskForm({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
      title: "", description: "", task_type: "call",
      priority: "medium", due_date: "",
    });
    const create = useMutation({
      mutationFn: async () => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await supabase.from("tasks").insert({
          title: form.title,
          description: form.description,
          task_type: form.task_type,
          priority: form.priority as "medium",
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
          assigned_to: userRes.user?.id,
          created_by: userRes.user?.id,
        } as never);
        if (error) throw error;
      },
      onSuccess: () => { toast.success("تمت الإضافة"); qc.invalidateQueries({ queryKey: ["tasks"] }); onClose(); },
      onError: (e: Error) => toast.error(e.message),
    });
    return (
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>مهمة جديدة</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">نوع المهمة</Label>
            <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TASK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">الأولوية</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">موعد التنفيذ</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">وصف</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    );
  }
}

function TaskList({ tasks, onToggle }: { tasks: Array<Record<string, unknown> & { id: string; title: string; description?: string | null; status: string; priority: string; task_type?: string | null; due_date?: string | null }>; onToggle: (id: string, done: boolean) => void }) {
  if (tasks.length === 0) {
    return (
      <Card className="p-16 text-center text-muted-foreground shadow-card">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>لا توجد مهام في هذه الفئة.</p>
      </Card>
    );
  }
  const priorityColor: Record<string, string> = {
    urgent: "bg-destructive text-destructive-foreground",
    high: "bg-warning text-warning-foreground",
    medium: "bg-info/10 text-info",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <div className="space-y-2">
      {tasks.map((t) => {
        const done = t.status === "completed";
        const overdue = !done && t.due_date && new Date(t.due_date) < new Date();
        return (
          <Card key={t.id} className={cn("shadow-card hover:shadow-elegant transition-shadow", overdue && "border-destructive/40")}>
            <CardContent className="p-4 flex items-start gap-3">
              <button
                onClick={() => onToggle(t.id, !done)}
                className={cn(
                  "h-5 w-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                  done ? "bg-success border-success text-success-foreground" : "border-border hover:border-primary"
                )}
              >
                {done && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className={cn("text-sm font-semibold", done && "line-through text-muted-foreground")}>{t.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("text-[10px]", priorityColor[t.priority])}>{labelOf(TASK_PRIORITIES, t.priority)}</Badge>
                    {t.task_type && <Badge variant="secondary" className="text-[10px]">{labelOf(TASK_TYPES, t.task_type)}</Badge>}
                  </div>
                </div>
                {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  <span className={cn(overdue && "text-destructive font-medium")}>{formatDate(t.due_date)}</span>
                  <span>·</span>
                  <span>{labelOf(TASK_STATUSES, t.status)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
