import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  FileText,
  KanbanSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Flame,
  Package,
  MessageSquareWarning,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/crm/StatCard";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP, formatNumber, LEAD_SOURCES, SERVICES, labelOf } from "@/lib/crm-constants";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [leadsToday, leadsWeek, leadsMonth, dealsWon, dealsLost, dealsOpen, pipelineValue, quotationsSent, tasksOverdue, complaintsOpen] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfDay),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
        supabase.from("deals").select("value").eq("stage", "won"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("stage", "lost"),
        supabase.from("deals").select("value").not("stage", "in", "(won,lost,dormant)"),
        supabase.from("deals").select("value").not("stage", "in", "(won,lost,dormant)"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", now.toISOString()).neq("status", "completed"),
        Promise.resolve({ count: 0 } as { count: number | null }),
      ]);

      const pipelineTotal = (pipelineValue.data ?? []).reduce((s, d) => s + Number(d.value || 0), 0);
      const wonTotal = (dealsWon.data ?? []).reduce((s, d) => s + Number(d.value || 0), 0);
      const wonCount = dealsWon.data?.length ?? 0;
      const lostCount = dealsLost.count ?? 0;
      const totalClosed = wonCount + lostCount;
      const conversion = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

      return {
        leadsToday: leadsToday.count ?? 0,
        leadsWeek: leadsWeek.count ?? 0,
        leadsMonth: leadsMonth.count ?? 0,
        wonCount,
        wonTotal,
        lostCount,
        openDeals: dealsOpen.data?.length ?? 0,
        pipelineTotal,
        quotationsSent: quotationsSent.count ?? 0,
        tasksOverdue: tasksOverdue.count ?? 0,
        complaintsOpen: complaintsOpen.count ?? 0,
        conversion,
      };
    },
  });

  const { data: bySource } = useQuery({
    queryKey: ["leads-by-source"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("source");
      const map = new Map<string, number>();
      (data ?? []).forEach((r) => map.set(r.source, (map.get(r.source) ?? 0) + 1));
      return Array.from(map.entries()).map(([source, count]) => ({
        source: labelOf(LEAD_SOURCES, source),
        count,
      }));
    },
  });

  const { data: byService } = useQuery({
    queryKey: ["leads-by-service"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("service");
      const map = new Map<string, number>();
      (data ?? []).forEach((r) => r.service && map.set(r.service, (map.get(r.service) ?? 0) + 1));
      return Array.from(map.entries()).map(([service, count]) => ({
        name: labelOf(SERVICES, service),
        value: count,
      }));
    },
  });

  const PIE_COLORS = ["oklch(0.575 0.212 25)", "oklch(0.68 0.19 32)", "oklch(0.75 0.16 75)", "oklch(0.62 0.17 155)", "oklch(0.6 0.14 240)", "oklch(0.5 0.02 264)"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم التنفيذية"
        description="نظرة عامة على أداء المبيعات، العملاء المحتملين، والحملات في الوقت الفعلي."
      />

      {/* Top KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="عملاء محتملون اليوم" value={formatNumber(stats?.leadsToday ?? 0)} icon={Users} tone="primary" hint="جميع القنوات" />
        <StatCard label="هذا الأسبوع" value={formatNumber(stats?.leadsWeek ?? 0)} icon={TrendingUp} tone="info" hint="آخر 7 أيام" />
        <StatCard label="هذا الشهر" value={formatNumber(stats?.leadsMonth ?? 0)} icon={Building2} tone="info" />
        <StatCard label="معدل التحويل" value={`${stats?.conversion ?? 0}%`} icon={Target} tone="success" hint="مربوح / مغلق" />

        <StatCard label="صفقات مفتوحة" value={formatNumber(stats?.openDeals ?? 0)} icon={KanbanSquare} tone="primary" />
        <StatCard label="قيمة خط الأنابيب" value={formatEGP(stats?.pipelineTotal ?? 0)} icon={Flame} tone="warning" />
        <StatCard label="صفقات مربوحة" value={formatEGP(stats?.wonTotal ?? 0)} icon={CheckCircle2} tone="success" hint={`${stats?.wonCount ?? 0} صفقة`} />
        <StatCard label="عروض مرسلة" value={formatNumber(stats?.quotationsSent ?? 0)} icon={FileText} tone="info" />

        <StatCard label="طلبات تحت الإنتاج" value={formatNumber(0)} icon={Package} tone="default" hint="المرحلة الثانية" />
        <StatCard label="متابعات متأخرة" value={formatNumber(stats?.tasksOverdue ?? 0)} icon={Clock} tone="warning" />
        <StatCard label="شكاوى مفتوحة" value={formatNumber(stats?.complaintsOpen ?? 0)} icon={MessageSquareWarning} tone="default" hint="المرحلة الثانية" />
        <StatCard label="صفقات خاسرة" value={formatNumber(stats?.lostCount ?? 0)} icon={AlertCircle} tone="default" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">العملاء المحتملون حسب المصدر</CardTitle>
          </CardHeader>
          <CardContent>
            {bySource && bySource.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySource}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label="لا توجد بيانات بعد — أضف عملاء محتملين لعرض التحليلات" />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">توزيع الخدمات المطلوبة</CardTitle>
          </CardHeader>
          <CardContent>
            {byService && byService.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byService} dataKey="value" nameKey="name" outerRadius={85} label={(entry) => entry.name}>
                      {byService.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label="لا توجد بيانات خدمات بعد" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">آخر النشاطات</CardTitle>
          <Badge variant="outline" className="text-[10px]">قيد التوسع</Badge>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-8 text-center">
          سيتم عرض الأنشطة الأخيرة هنا (مكالمات، اجتماعات، رسائل واتساب، وتحديثات الصفقات).
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
      {label}
    </div>
  );
}
