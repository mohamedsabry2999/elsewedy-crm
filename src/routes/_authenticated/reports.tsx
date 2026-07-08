import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_SOURCES, SERVICES, SECTORS, DEAL_STAGES, labelOf, formatEGP } from "@/lib/crm-constants";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const COLORS = ["oklch(0.575 0.212 25)", "oklch(0.68 0.19 32)", "oklch(0.75 0.16 75)", "oklch(0.62 0.17 155)", "oklch(0.6 0.14 240)", "oklch(0.5 0.02 264)"];

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [leadsBySource, leadsBySector, leadsByService, dealsByStage] = await Promise.all([
        supabase.from("leads").select("source"),
        supabase.from("leads").select("sector"),
        supabase.from("leads").select("service"),
        supabase.from("deals").select("stage, value"),
      ]);

      const group = (rows: Array<{ [k: string]: string | null }>, key: string, list: readonly { value: string; label: string }[]) => {
        const m = new Map<string, number>();
        rows.forEach((r) => {
          const v = r[key];
          if (v) m.set(v, (m.get(v) ?? 0) + 1);
        });
        return Array.from(m.entries()).map(([k, count]) => ({ name: labelOf(list, k), count }));
      };

      const stageAgg = new Map<string, { count: number; value: number }>();
      (dealsByStage.data ?? []).forEach((d) => {
        const cur = stageAgg.get(d.stage) ?? { count: 0, value: 0 };
        cur.count++;
        cur.value += Number(d.value || 0);
        stageAgg.set(d.stage, cur);
      });

      return {
        bySource: group(leadsBySource.data ?? [], "source", LEAD_SOURCES),
        bySector: group(leadsBySector.data ?? [], "sector", SECTORS),
        byService: group(leadsByService.data ?? [], "service", SERVICES),
        byStage: Array.from(stageAgg.entries()).map(([k, v]) => ({ name: labelOf(DEAL_STAGES, k), count: v.count, value: v.value })),
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="التقارير"
        description="نظرة تحليلية شاملة على الأداء والمصادر والتحويل."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="العملاء المحتملون حسب المصدر" data={data?.bySource} type="bar" />
        <ChartCard title="العملاء المحتملون حسب القطاع" data={data?.bySector} type="pie" />
        <ChartCard title="العملاء المحتملون حسب الخدمة" data={data?.byService} type="pie" />
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">توزيع الصفقات على المراحل</CardTitle></CardHeader>
          <CardContent>
            {data?.byStage && data.byStage.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byStage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number, n: string) => n === "value" ? formatEGP(v) : v} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar name="عدد الصفقات" dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                    <Bar name="القيمة" dataKey="value" fill="var(--color-primary-glow)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, data, type }: { title: string; data?: Array<{ name: string; count: number }>; type: "bar" | "pie" }) {
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {type === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={data} dataKey="count" nameKey="name" outerRadius={90} label={(e) => e.name}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : <Empty />}
      </CardContent>
    </Card>
  );
}

function Empty() {
  return <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات كافية بعد</div>;
}
