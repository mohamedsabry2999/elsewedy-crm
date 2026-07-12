import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users, Building2, FileText, KanbanSquare, TrendingUp, Clock,
  AlertCircle, CheckCircle2, Flame, Package, MessageSquareWarning,
  Target, Wallet, Truck, RotateCcw, Calculator,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/crm/StatCard";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatEGP, formatNumber, LEAD_SOURCES, SERVICES, labelOf,
  DEAL_STAGE_PROBABILITY, IN_PRODUCTION_ORDER_STATUSES, OPEN_ORDER_STATUSES,
} from "@/lib/crm-constants";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

type RangeKey = "7d" | "30d" | "90d" | "ytd" | "all";
const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
  { value: "ytd", label: "منذ بداية السنة" },
  { value: "all", label: "كل الفترات" },
];

function rangeStart(key: RangeKey): string | null {
  const now = new Date();
  if (key === "all") return null;
  if (key === "ytd") return new Date(now.getFullYear(), 0, 1).toISOString();
  const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 86400_000).toISOString();
}

function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const rangeStartISO = rangeStart(range);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", range],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 86400_000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const nowISO = now.toISOString();

      // Build lead query with optional range filter
      const leadsInRange = supabase.from("leads").select("id", { count: "exact", head: true });
      if (rangeStartISO) leadsInRange.gte("created_at", rangeStartISO);

      const [
        leadsToday, leadsWeek, leadsMonth, leadsRange, leadsNoFollowup, leadsUnassigned,
        dealsWonRows, dealsLostCount, dealsOpenRows,
        quotationsAll, quotationsSent, quotationsApproved, quotationsRejected,
        quotationsWaiting, quotationsExpired, quotationsFollowUp,
        ordersAll, ordersInProduction, ordersDelivered, ordersDelayed, ordersOpen,
        complaintsOpen, complaintsCritical,
        paymentsOverdue, paymentsUnpaid,
        tasksOverdue,
        reorderCandidates,
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfDay),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
        leadsInRange,
        supabase.from("leads").select("id", { count: "exact", head: true }).is("next_followup_date", null).not("status", "in", "(converted,lost)"),
        supabase.from("leads").select("id", { count: "exact", head: true }).is("assigned_to", null),

        supabase.from("deals").select("value, stage").eq("stage", "won"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("stage", "lost"),
        supabase.from("deals").select("value, stage").not("stage", "in", "(won,lost,dormant)"),

        supabase.from("quotations").select("id, total_price, final_price, status, created_at"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "waiting_pricing"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "expired"),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("status", "follow_up"),

        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", IN_PRODUCTION_ORDER_STATUSES as unknown as ("in_production"|"quality_check"|"packaging")[]),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
        supabase.from("orders").select("id", { count: "exact", head: true }).lt("delivery_date", nowISO).not("status", "in", "(delivered,cancelled)"),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", OPEN_ORDER_STATUSES as unknown as ("new"|"in_production"|"quality_check"|"packaging"|"ready"|"shipped"|"on_hold")[]),

        supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "investigating", "escalated"]),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("severity", "critical").not("status", "in", "(resolved,closed)"),

        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "overdue"),
        supabase.from("payments").select("total_amount, paid_amount, status").in("status", ["unpaid", "partial", "overdue"]),

        supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", nowISO).neq("status", "completed"),

        // Re-order candidates: clients with last order > 60 days ago
        supabase.from("clients").select("id", { count: "exact", head: true }).lt("last_order_date", new Date(now.getTime() - 60 * 86400_000).toISOString()),
      ]);

      const wonRows = dealsWonRows.data ?? [];
      const openRows = dealsOpenRows.data ?? [];
      const wonTotal = wonRows.reduce((s, d) => s + Number(d.value || 0), 0);
      const pipelineTotal = openRows.reduce((s, d) => s + Number(d.value || 0), 0);
      const weightedPipeline = openRows.reduce(
        (s, d) => s + Number(d.value || 0) * (DEAL_STAGE_PROBABILITY[d.stage] ?? 0),
        0,
      );
      const wonCount = wonRows.length;
      const lostCount = dealsLostCount.count ?? 0;
      const conversion = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

      const quotations = quotationsAll.data ?? [];
      const quotationValues = quotations
        .map((q) => Number(q.final_price || q.total_price || 0))
        .filter((n) => n > 0);
      const avgQuotationValue = quotationValues.length
        ? quotationValues.reduce((a, b) => a + b, 0) / quotationValues.length
        : 0;
      const quotationApprovedCount = quotationsApproved.count ?? 0;
      const quotationTotalCount = quotations.length;
      const quotationConversion = quotationTotalCount > 0
        ? Math.round((quotationApprovedCount / quotationTotalCount) * 100)
        : 0;

      const outstandingReceivable = (paymentsUnpaid.data ?? []).reduce(
        (s, p) => s + Math.max(0, Number(p.total_amount || 0) - Number(p.paid_amount || 0)),
        0,
      );

      return {
        leadsToday: leadsToday.count ?? 0,
        leadsWeek: leadsWeek.count ?? 0,
        leadsMonth: leadsMonth.count ?? 0,
        leadsRange: leadsRange.count ?? 0,
        leadsNoFollowup: leadsNoFollowup.count ?? 0,
        leadsUnassigned: leadsUnassigned.count ?? 0,

        wonCount, wonTotal, lostCount,
        openDeals: openRows.length,
        pipelineTotal, weightedPipeline, conversion,

        quotationTotal: quotationTotalCount,
        quotationsSent: quotationsSent.count ?? 0,
        quotationsApproved: quotationApprovedCount,
        quotationsRejected: quotationsRejected.count ?? 0,
        quotationsWaiting: quotationsWaiting.count ?? 0,
        quotationsExpired: quotationsExpired.count ?? 0,
        quotationsFollowUp: quotationsFollowUp.count ?? 0,
        avgQuotationValue, quotationConversion,

        ordersTotal: ordersAll.count ?? 0,
        ordersInProduction: ordersInProduction.count ?? 0,
        ordersDelivered: ordersDelivered.count ?? 0,
        ordersDelayed: ordersDelayed.count ?? 0,
        ordersOpen: ordersOpen.count ?? 0,

        complaintsOpen: complaintsOpen.count ?? 0,
        complaintsCritical: complaintsCritical.count ?? 0,

        paymentsOverdue: paymentsOverdue.count ?? 0,
        outstandingReceivable,

        tasksOverdue: tasksOverdue.count ?? 0,
        reorderCandidates: reorderCandidates.count ?? 0,
      };
    },
  });

  const { data: bySource } = useQuery({
    queryKey: ["leads-by-source", range],
    queryFn: async () => {
      const q = supabase.from("leads").select("source");
      if (rangeStartISO) q.gte("created_at", rangeStartISO);
      const { data } = await q;
      const map = new Map<string, number>();
      (data ?? []).forEach((r) => r.source && map.set(r.source, (map.get(r.source) ?? 0) + 1));
      return Array.from(map.entries()).map(([source, count]) => ({
        source: labelOf(LEAD_SOURCES, source), count,
      }));
    },
  });

  const { data: byService } = useQuery({
    queryKey: ["leads-by-service", range],
    queryFn: async () => {
      const q = supabase.from("leads").select("service");
      if (rangeStartISO) q.gte("created_at", rangeStartISO);
      const { data } = await q;
      const map = new Map<string, number>();
      (data ?? []).forEach((r) => r.service && map.set(r.service, (map.get(r.service) ?? 0) + 1));
      return Array.from(map.entries()).map(([service, count]) => ({
        name: labelOf(SERVICES, service), value: count,
      }));
    },
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("id, activity_type, subject, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const PIE_COLORS = ["oklch(0.575 0.212 25)", "oklch(0.68 0.19 32)", "oklch(0.75 0.16 75)", "oklch(0.62 0.17 155)", "oklch(0.6 0.14 240)", "oklch(0.5 0.02 264)"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم التنفيذية"
        description="مؤشرات مباشرة من قاعدة البيانات — كل رقم مربوط بسجلات حقيقية."
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      {/* Leads */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground mb-3">العملاء المحتملون</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="اليوم" value={formatNumber(stats?.leadsToday ?? 0)} icon={Users} tone="primary" />
          <StatCard label="هذا الأسبوع" value={formatNumber(stats?.leadsWeek ?? 0)} icon={TrendingUp} tone="info" />
          <StatCard label="هذا الشهر" value={formatNumber(stats?.leadsMonth ?? 0)} icon={Building2} tone="info" />
          <StatCard label="ضمن الفترة" value={formatNumber(stats?.leadsRange ?? 0)} icon={Users} tone="default" />
          <StatCard label="بدون متابعة" value={formatNumber(stats?.leadsNoFollowup ?? 0)} icon={Clock} tone={stats?.leadsNoFollowup ? "warning" : "default"} />
          <StatCard label="بدون مسؤول" value={formatNumber(stats?.leadsUnassigned ?? 0)} icon={AlertCircle} tone={stats?.leadsUnassigned ? "warning" : "default"} />
        </div>
      </section>

      {/* Sales / Deals */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground mb-3">المبيعات والصفقات</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="صفقات مفتوحة" value={formatNumber(stats?.openDeals ?? 0)} icon={KanbanSquare} tone="primary" />
          <StatCard label="قيمة خط الأنابيب" value={formatEGP(stats?.pipelineTotal ?? 0)} icon={Flame} tone="warning" />
          <StatCard label="التوقع المرجح" value={formatEGP(stats?.weightedPipeline ?? 0)} icon={Calculator} tone="info" hint="القيمة × الاحتمالية" />
          <StatCard label="صفقات مربوحة" value={formatEGP(stats?.wonTotal ?? 0)} icon={CheckCircle2} tone="success" hint={`${stats?.wonCount ?? 0} صفقة`} />
          <StatCard label="صفقات خاسرة" value={formatNumber(stats?.lostCount ?? 0)} icon={AlertCircle} tone="default" />
          <StatCard label="معدل التحويل" value={`${stats?.conversion ?? 0}%`} icon={Target} tone="success" hint="مربوح / (مربوح + خاسر)" />
        </div>
      </section>

      {/* Quotations */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground mb-3">عروض الأسعار</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="بانتظار التسعير" value={formatNumber(stats?.quotationsWaiting ?? 0)} icon={Clock} tone={stats?.quotationsWaiting ? "warning" : "default"} />
          <StatCard label="مرسلة" value={formatNumber(stats?.quotationsSent ?? 0)} icon={FileText} tone="info" />
          <StatCard label="معتمدة" value={formatNumber(stats?.quotationsApproved ?? 0)} icon={CheckCircle2} tone="success" />
          <StatCard label="مرفوضة / منتهية" value={formatNumber((stats?.quotationsRejected ?? 0) + (stats?.quotationsExpired ?? 0))} icon={AlertCircle} tone="default" />
          <StatCard label="متوسط قيمة العرض" value={formatEGP(stats?.avgQuotationValue ?? 0)} icon={Calculator} tone="default" />
          <StatCard label="معدل الاعتماد" value={`${stats?.quotationConversion ?? 0}%`} icon={Target} tone="success" hint="معتمد / إجمالي" />
        </div>
      </section>

      {/* Operations */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground mb-3">التشغيل والإنتاج</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="طلبات مفتوحة" value={formatNumber(stats?.ordersOpen ?? 0)} icon={Package} tone="primary" />
          <StatCard label="تحت الإنتاج" value={formatNumber(stats?.ordersInProduction ?? 0)} icon={Package} tone="info" />
          <StatCard label="تم التسليم" value={formatNumber(stats?.ordersDelivered ?? 0)} icon={Truck} tone="success" />
          <StatCard label="متأخرة عن الموعد" value={formatNumber(stats?.ordersDelayed ?? 0)} icon={AlertCircle} tone={stats?.ordersDelayed ? "warning" : "default"} />
          <StatCard label="شكاوى مفتوحة" value={formatNumber(stats?.complaintsOpen ?? 0)} icon={MessageSquareWarning} tone={stats?.complaintsOpen ? "warning" : "default"} hint={`${stats?.complaintsCritical ?? 0} حرجة`} />
          <StatCard label="متابعات متأخرة" value={formatNumber(stats?.tasksOverdue ?? 0)} icon={Clock} tone={stats?.tasksOverdue ? "warning" : "default"} />
        </div>
      </section>

      {/* Finance & Retention */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground mb-3">المالية والعملاء</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="مستحقات غير محصلة" value={formatEGP(stats?.outstandingReceivable ?? 0)} icon={Wallet} tone={stats?.outstandingReceivable ? "warning" : "default"} />
          <StatCard label="دفعات متأخرة" value={formatNumber(stats?.paymentsOverdue ?? 0)} icon={AlertCircle} tone={stats?.paymentsOverdue ? "warning" : "default"} />
          <StatCard label="مرشحون لإعادة الطلب" value={formatNumber(stats?.reorderCandidates ?? 0)} icon={RotateCcw} tone="info" hint="آخر طلب > 60 يوم" />
          <StatCard label="إجمالي الطلبات" value={formatNumber(stats?.ordersTotal ?? 0)} icon={Package} tone="default" />
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">العملاء المحتملون حسب المصدر</CardTitle></CardHeader>
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
            ) : <EmptyChart label="لا توجد بيانات ضمن الفترة المحددة" />}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">توزيع الخدمات المطلوبة</CardTitle></CardHeader>
          <CardContent>
            {byService && byService.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byService} dataKey="value" nameKey="name" outerRadius={85} label={(entry) => entry.name}>
                      {byService.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart label="لا توجد بيانات خدمات ضمن الفترة" />}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">آخر النشاطات</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">جارٍ التحميل...</div>
          ) : (recentActivities ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">لا توجد نشاطات مسجلة بعد.</div>
          ) : (
            <ul className="divide-y divide-border">
              {(recentActivities ?? []).map((a) => (
                <li key={a.id} className="py-2 flex justify-between gap-3">
                  <span className="truncate">{a.subject ?? a.activity_type}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(a.created_at))}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
