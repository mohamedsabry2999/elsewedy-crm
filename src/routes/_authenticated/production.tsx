import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, CheckCircle2, Circle, PlayCircle, PauseCircle } from "lucide-react";
import { PRODUCTION_STAGE_STATUSES, labelOf, formatDate } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/production")({
  component: ProductionPage,
});

const statusIcon = {
  pending: Circle,
  in_progress: PlayCircle,
  done: CheckCircle2,
  blocked: PauseCircle,
  skipped: Circle,
} as const;

const statusColor: Record<string, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-warning",
  done: "text-success",
  blocked: "text-destructive",
  skipped: "text-muted-foreground",
};

function ProductionPage() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["orders-with-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, title, status, delivery_date, clients(company_name), production_stages(id, stage_name, stage_order, status, started_at, completed_at)")
        .in("status", ["new", "in_production", "quality_check", "packaging", "ready", "on_hold"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStage = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "in_progress") patch.started_at = new Date().toISOString();
    if (status === "done") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("production_stages").update(patch as never).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["orders-with-stages"] });
    }
  };

  return (
    <div>
      <PageHeader title="تتبع الإنتاج" description="متابعة كل طلب مرحلة بمرحلة من التصميم حتى الشحن." />

      {(orders ?? []).length === 0 && (
        <Card className="shadow-card"><CardContent className="p-16 text-center text-muted-foreground">
          <Factory className="h-12 w-12 mx-auto mb-3 opacity-40" />
          لا توجد طلبات نشطة في الإنتاج حالياً.
        </CardContent></Card>
      )}

      <div className="space-y-4">
        {(orders ?? []).map((o) => {
          const stages = (o.production_stages ?? []).slice().sort((a, b) => a.stage_order - b.stage_order);
          const done = stages.filter((s) => s.status === "done").length;
          const pct = stages.length ? Math.round((done / stages.length) * 100) : 0;
          return (
            <Card key={o.id} className="shadow-card">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{o.order_number}</span>
                      <h3 className="font-bold">{o.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{o.clients?.company_name} • تسليم {formatDate(o.delivery_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">التقدم</div>
                    <div className="w-40 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-bold text-sm ltr-nums">{pct}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {stages.map((s) => {
                    const Icon = statusIcon[s.status as keyof typeof statusIcon] ?? Circle;
                    return (
                      <div key={s.id} className="rounded-lg border border-border p-3 bg-background">
                        <div className="flex items-start gap-2">
                          <Icon className={`h-5 w-5 shrink-0 ${statusColor[s.status]}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.stage_name}</p>
                            <Badge variant="outline" className="mt-1 text-[10px]">{labelOf(PRODUCTION_STAGE_STATUSES, s.status)}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {s.status !== "in_progress" && s.status !== "done" && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => updateStage(s.id, "in_progress")}>بدء</Button>
                          )}
                          {s.status !== "done" && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-success" onClick={() => updateStage(s.id, "done")}>إنجاز</Button>
                          )}
                          {s.status === "in_progress" && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-destructive" onClick={() => updateStage(s.id, "blocked")}>وقف</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
