import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatCard } from "@/components/crm/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LEAD_SOURCES, SERVICES, SECTORS, DEAL_STAGES, QUOTATION_STATUSES,
  ORDER_STATUSES, DEAL_STAGE_PROBABILITY,
  labelOf, formatEGP, formatNumber, formatDate,
} from "@/lib/crm-constants";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });

const COLORS = ["oklch(0.575 0.212 25)", "oklch(0.68 0.19 32)", "oklch(0.75 0.16 75)", "oklch(0.62 0.17 155)", "oklch(0.6 0.14 240)", "oklch(0.5 0.02 264)"];

type RangeKey = "7d" | "30d" | "90d" | "ytd" | "all";
const RANGES: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
  { value: "ytd", label: "منذ بداية السنة" },
  { value: "all", label: "كل الفترات" },
];
function rangeStart(k: RangeKey): string | null {
  const n = new Date();
  if (k === "all") return null;
  if (k === "ytd") return new Date(n.getFullYear(), 0, 1).toISOString();
  const d = k === "7d" ? 7 : k === "30d" ? 30 : 90;
  return new Date(n.getTime() - d * 86400_000).toISOString();
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function groupBy<T>(rows: T[], key: (r: T) => string | null | undefined) {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  });
  return m;
}

function ReportsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const startISO = rangeStart(range);

  return (
    <div>
      <PageHeader
        title="التقارير التحليلية"
        description="كل الأرقام محسوبة مباشرة من قاعدة البيانات ضمن الفترة المحددة."
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="sales" dir="rtl">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="quotations">العروض</TabsTrigger>
          <TabsTrigger value="orders">الطلبات والإنتاج</TabsTrigger>
          <TabsTrigger value="complaints">الشكاوى</TabsTrigger>
          <TabsTrigger value="deliveries">التسليم</TabsTrigger>
          <TabsTrigger value="collections">التحصيل</TabsTrigger>
          <TabsTrigger value="marketing">التسويق</TabsTrigger>
        </TabsList>

        <TabsContent value="sales"><SalesReport startISO={startISO} /></TabsContent>
        <TabsContent value="quotations"><QuotationsReport startISO={startISO} /></TabsContent>
        <TabsContent value="orders"><OrdersReport startISO={startISO} /></TabsContent>
        <TabsContent value="complaints"><ComplaintsReport startISO={startISO} /></TabsContent>
        <TabsContent value="deliveries"><DeliveriesReport startISO={startISO} /></TabsContent>
        <TabsContent value="collections"><CollectionsReport startISO={startISO} /></TabsContent>
        <TabsContent value="marketing"><MarketingReport startISO={startISO} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────── SALES ─────────── */
function SalesReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-sales", startISO],
    queryFn: async () => {
      const leadsQ = supabase.from("leads").select("source, sector, service, status, created_at");
      const dealsQ = supabase.from("deals").select("stage, value, created_at");
      if (startISO) { leadsQ.gte("created_at", startISO); dealsQ.gte("created_at", startISO); }
      const [leadsR, dealsR] = await Promise.all([leadsQ, dealsQ]);
      const leads = leadsR.data ?? [];
      const deals = dealsR.data ?? [];
      const bySource = Array.from(groupBy(leads, (r) => r.source)).map(([k, count]) => ({ name: labelOf(LEAD_SOURCES, k), count }));
      const bySector = Array.from(groupBy(leads, (r) => r.sector)).map(([k, count]) => ({ name: labelOf(SECTORS, k), count }));
      const byService = Array.from(groupBy(leads, (r) => r.service)).map(([k, count]) => ({ name: labelOf(SERVICES, k), count }));
      const stageMap = new Map<string, { count: number; value: number }>();
      deals.forEach((d) => {
        const c = stageMap.get(d.stage) ?? { count: 0, value: 0 };
        c.count++; c.value += Number(d.value || 0);
        stageMap.set(d.stage, c);
      });
      const byStage = Array.from(stageMap.entries()).map(([k, v]) => ({ name: labelOf(DEAL_STAGES, k), count: v.count, value: v.value }));
      const won = deals.filter((d) => d.stage === "won");
      const lost = deals.filter((d) => d.stage === "lost");
      const open = deals.filter((d) => !["won", "lost", "dormant"].includes(d.stage));
      const wonTotal = won.reduce((s, d) => s + Number(d.value || 0), 0);
      const pipeline = open.reduce((s, d) => s + Number(d.value || 0), 0);
      const weighted = open.reduce((s, d) => s + Number(d.value || 0) * (DEAL_STAGE_PROBABILITY[d.stage] ?? 0), 0);
      const conv = won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
      return { leadsCount: leads.length, dealsCount: deals.length, wonTotal, pipeline, weighted, conv, bySource, bySector, byService, byStage };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="عملاء محتملون" value={formatNumber(data?.leadsCount ?? 0)} />
        <StatCard label="صفقات" value={formatNumber(data?.dealsCount ?? 0)} />
        <StatCard label="خط الأنابيب" value={formatEGP(data?.pipeline ?? 0)} tone="warning" />
        <StatCard label="التوقع المرجح" value={formatEGP(data?.weighted ?? 0)} tone="info" />
        <StatCard label="مربوح" value={formatEGP(data?.wonTotal ?? 0)} tone="success" />
        <StatCard label="نسبة التحويل" value={`${data?.conv ?? 0}%`} tone="success" />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadCSV("sales-by-stage.csv", data?.byStage ?? [])}>
          <Download className="ml-1 h-4 w-4" /> تصدير CSV
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarCard title="حسب المصدر" data={data?.bySource} />
        <PieCard title="حسب القطاع" data={data?.bySector} />
        <PieCard title="حسب الخدمة" data={data?.byService} />
        <StageValueCard title="الصفقات لكل مرحلة" data={data?.byStage} />
      </div>
    </div>
  );
}

/* ─────────── QUOTATIONS ─────────── */
function QuotationsReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-quotations", startISO],
    queryFn: async () => {
      const q = supabase.from("quotations").select("status, total_price, final_price, created_at, delivery_date");
      if (startISO) q.gte("created_at", startISO);
      const { data } = await q;
      const rows = data ?? [];
      const byStatus = Array.from(groupBy(rows, (r) => r.status)).map(([k, count]) => ({ name: labelOf(QUOTATION_STATUSES, k), count }));
      const values = rows.map((r) => Number(r.final_price || r.total_price || 0)).filter((n) => n > 0);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const total = values.reduce((a, b) => a + b, 0);
      const approvedCount = rows.filter((r) => r.status === "approved").length;
      const conv = rows.length > 0 ? Math.round((approvedCount / rows.length) * 100) : 0;
      return { total: rows.length, avg, totalValue: total, approvedCount, conv, byStatus, rows };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي العروض" value={formatNumber(data?.total ?? 0)} />
        <StatCard label="القيمة الإجمالية" value={formatEGP(data?.totalValue ?? 0)} tone="info" />
        <StatCard label="متوسط قيمة العرض" value={formatEGP(data?.avg ?? 0)} />
        <StatCard label="معدل الاعتماد" value={`${data?.conv ?? 0}%`} tone="success" />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadCSV("quotations.csv", (data?.rows ?? []).map((r) => ({
          status: labelOf(QUOTATION_STATUSES, r.status), total: r.total_price, final: r.final_price, created_at: formatDate(r.created_at), delivery: formatDate(r.delivery_date),
        })))}>
          <Download className="ml-1 h-4 w-4" /> تصدير CSV
        </Button>
      </div>
      <BarCard title="حسب الحالة" data={data?.byStatus} />
    </div>
  );
}

/* ─────────── ORDERS / PRODUCTION ─────────── */
function OrdersReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-orders", startISO],
    queryFn: async () => {
      const q = supabase.from("orders").select("status, total_amount, delivery_date, created_at, actual_delivery_date");
      if (startISO) q.gte("created_at", startISO);
      const { data } = await q;
      const rows = data ?? [];
      const byStatus = Array.from(groupBy(rows, (r) => r.status)).map(([k, count]) => ({ name: labelOf(ORDER_STATUSES, k), count }));
      const now = Date.now();
      const delayed = rows.filter((r) => r.status !== "delivered" && r.status !== "cancelled" && r.delivery_date && new Date(r.delivery_date).getTime() < now).length;
      const delivered = rows.filter((r) => r.status === "delivered");
      const onTime = delivered.filter((r) => r.actual_delivery_date && r.delivery_date && new Date(r.actual_delivery_date).getTime() <= new Date(r.delivery_date).getTime()).length;
      const otd = delivered.length > 0 ? Math.round((onTime / delivered.length) * 100) : 0;
      const totalValue = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      return { total: rows.length, delayed, delivered: delivered.length, otd, totalValue, byStatus, rows };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="إجمالي الطلبات" value={formatNumber(data?.total ?? 0)} />
        <StatCard label="تم التسليم" value={formatNumber(data?.delivered ?? 0)} tone="success" />
        <StatCard label="متأخرة" value={formatNumber(data?.delayed ?? 0)} tone="warning" />
        <StatCard label="التسليم في الموعد" value={`${data?.otd ?? 0}%`} tone="info" />
        <StatCard label="القيمة الإجمالية" value={formatEGP(data?.totalValue ?? 0)} tone="info" />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadCSV("orders.csv", (data?.rows ?? []).map((r) => ({
          status: labelOf(ORDER_STATUSES, r.status), total: r.total_amount, delivery: formatDate(r.delivery_date), delivered: formatDate(r.actual_delivery_date), created_at: formatDate(r.created_at),
        })))}>
          <Download className="ml-1 h-4 w-4" /> تصدير CSV
        </Button>
      </div>
      <BarCard title="حسب الحالة" data={data?.byStatus} />
    </div>
  );
}

/* ─────────── COMPLAINTS ─────────── */
function ComplaintsReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-complaints", startISO],
    queryFn: async () => {
      const q = supabase.from("complaints").select("status, severity, complaint_type, created_at, resolved_at");
      if (startISO) q.gte("created_at", startISO);
      const { data } = await q;
      const rows = data ?? [];
      const byCategory = Array.from(groupBy(rows, (r) => r.complaint_type)).map(([k, count]) => ({ name: k, count }));
      const bySeverity = Array.from(groupBy(rows, (r) => r.severity)).map(([k, count]) => ({ name: k, count }));
      const resolved = rows.filter((r) => r.resolved_at);
      const avgHours = resolved.length
        ? resolved.reduce((s, r) => s + (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 36e5, 0) / resolved.length
        : 0;
      const openCount = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
      return { total: rows.length, resolved: resolved.length, openCount, avgHours, byCategory, bySeverity, rows };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الشكاوى" value={formatNumber(data?.total ?? 0)} />
        <StatCard label="مفتوحة" value={formatNumber(data?.openCount ?? 0)} tone="warning" />
        <StatCard label="مغلقة" value={formatNumber(data?.resolved ?? 0)} tone="success" />
        <StatCard label="متوسط وقت الحل (ساعة)" value={formatNumber(Math.round(data?.avgHours ?? 0))} tone="info" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarCard title="حسب الفئة" data={data?.byCategory} />
        <PieCard title="حسب الأولوية" data={data?.bySeverity} />
      </div>
    </div>
  );
}

/* ─────────── DELIVERIES ─────────── */
function DeliveriesReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-deliveries", startISO],
    queryFn: async () => {
      const q = supabase.from("deliveries").select("status, method, scheduled_at, delivered_at, created_at");
      if (startISO) q.gte("created_at", startISO);
      const { data } = await q;
      const rows = data ?? [];
      const byStatus = Array.from(groupBy(rows, (r) => r.status)).map(([k, count]) => ({ name: k, count }));
      const byMethod = Array.from(groupBy(rows, (r) => r.method)).map(([k, count]) => ({ name: k, count }));
      const delivered = rows.filter((r) => r.delivered_at);
      const onTime = delivered.filter((r) => r.scheduled_at && new Date(r.delivered_at!).getTime() <= new Date(r.scheduled_at).getTime()).length;
      const otd = delivered.length ? Math.round((onTime / delivered.length) * 100) : 0;
      return { total: rows.length, delivered: delivered.length, otd, byStatus, byMethod };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="إجمالي عمليات التسليم" value={formatNumber(data?.total ?? 0)} />
        <StatCard label="مكتملة" value={formatNumber(data?.delivered ?? 0)} tone="success" />
        <StatCard label="التسليم في الموعد" value={`${data?.otd ?? 0}%`} tone="info" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarCard title="حسب الحالة" data={data?.byStatus} />
        <PieCard title="طرق التسليم" data={data?.byMethod} />
      </div>
    </div>
  );
}

/* ─────────── COLLECTIONS ─────────── */
function CollectionsReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-collections", startISO],
    queryFn: async () => {
      const q = supabase.from("payments").select("status, total_amount, paid_amount, due_date, created_at, updated_at, method");
      if (startISO) q.gte("created_at", startISO);
      const { data } = await q;
      const rows = data ?? [];
      const totalDue = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      const totalPaid = rows.reduce((s, r) => s + Number(r.paid_amount || 0), 0);
      const outstanding = totalDue - totalPaid;
      const overdue = rows.filter((r) => r.status === "overdue");
      const overdueAmount = overdue.reduce((s, r) => s + Math.max(0, Number(r.total_amount || 0) - Number(r.paid_amount || 0)), 0);
      const byStatus = Array.from(groupBy(rows, (r) => r.status)).map(([k, count]) => ({ name: k, count }));
      const byMethod = Array.from(groupBy(rows, (r) => r.method)).map(([k, count]) => ({ name: k, count }));
      // Trend by day
      const trendMap = new Map<string, number>();
      rows.filter((r) => r.updated_at && Number(r.paid_amount) > 0).forEach((r) => {
        const d = r.updated_at!.slice(0, 10);
        trendMap.set(d, (trendMap.get(d) ?? 0) + Number(r.paid_amount));
      });
      const trend = Array.from(trendMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
      return { totalDue, totalPaid, outstanding, overdueCount: overdue.length, overdueAmount, byStatus, byMethod, trend };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي المستحق" value={formatEGP(data?.totalDue ?? 0)} />
        <StatCard label="إجمالي المحصل" value={formatEGP(data?.totalPaid ?? 0)} tone="success" />
        <StatCard label="غير محصل" value={formatEGP(data?.outstanding ?? 0)} tone="warning" />
        <StatCard label="متأخرات" value={formatEGP(data?.overdueAmount ?? 0)} tone="warning" hint={`${data?.overdueCount ?? 0} دفعة`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarCard title="حسب الحالة" data={data?.byStatus} />
        <PieCard title="طرق الدفع" data={data?.byMethod} />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">اتجاه التحصيل</CardTitle></CardHeader>
        <CardContent>
          {data?.trend && data.trend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatEGP(v)} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty />}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────── MARKETING ─────────── */
function MarketingReport({ startISO }: { startISO: string | null }) {
  const { data } = useQuery({
    queryKey: ["rep-marketing", startISO],
    queryFn: async () => {
      const q = supabase.from("campaigns").select("name, platform, budget, spent, revenue, leads_generated, deals_closed, status, created_at");
      if (startISO) q.gte("created_at", startISO);
      const { data } = await q;
      const rows = data ?? [];
      const totalBudget = rows.reduce((s, r) => s + Number(r.budget || 0), 0);
      const totalSpent = rows.reduce((s, r) => s + Number(r.spent || 0), 0);
      const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
      const totalLeads = rows.reduce((s, r) => s + Number(r.leads_generated || 0), 0);
      const qualifiedLeads = rows.reduce((s, r) => s + Number(r.deals_closed || 0), 0);
      const roi = totalSpent > 0 ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100) : 0;
      const cac = qualifiedLeads > 0 ? totalSpent / qualifiedLeads : 0;
      const cpql = qualifiedLeads > 0 ? totalSpent / qualifiedLeads : 0;
      const byChannel = Array.from(groupBy(rows, (r) => r.platform)).map(([k, count]) => ({ name: k, count }));
      return { totalBudget, totalSpent, totalRevenue, totalLeads, qualifiedLeads, roi, cac, cpql, byChannel, rows };
    },
  });

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="الميزانية" value={formatEGP(data?.totalBudget ?? 0)} />
        <StatCard label="المصروف" value={formatEGP(data?.totalSpent ?? 0)} tone="warning" />
        <StatCard label="الإيرادات" value={formatEGP(data?.totalRevenue ?? 0)} tone="success" />
        <StatCard label="ROI" value={`${data?.roi ?? 0}%`} tone={(data?.roi ?? 0) >= 0 ? "success" : "warning"} />
        <StatCard label="عملاء مؤهلون" value={formatNumber(data?.qualifiedLeads ?? 0)} tone="info" />
        <StatCard label="CPQL" value={formatEGP(data?.cpql ?? 0)} hint="تكلفة العميل المؤهل" />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadCSV("campaigns.csv", (data?.rows ?? []).map((r) => ({
          name: r.name, channel: r.platform, budget: r.budget, spent: r.spent, revenue: r.revenue,
          leads: r.leads_generated, qualified: r.deals_closed, status: r.status,
        })))}>
          <Download className="ml-1 h-4 w-4" /> تصدير CSV
        </Button>
      </div>
      <BarCard title="الحملات حسب القناة" data={data?.byChannel} />
    </div>
  );
}

/* ─────────── Shared chart primitives ─────────── */
function BarCard({ title, data }: { title: string; data?: Array<{ name: string; count: number }> }) {
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Empty />}
      </CardContent>
    </Card>
  );
}

function PieCard({ title, data }: { title: string; data?: Array<{ name: string; count: number }> }) {
  const safe = useMemo(() => (data ?? []).filter((d) => d.name), [data]);
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {safe.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={safe} dataKey="count" nameKey="name" outerRadius={85} label={(e) => e.name}>
                  {safe.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <Empty />}
      </CardContent>
    </Card>
  );
}

function StageValueCard({ title, data }: { title: string; data?: Array<{ name: string; count: number; value: number }> }) {
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, n: string) => (n === "value" ? formatEGP(v) : v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name="عدد" dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar name="قيمة" dataKey="value" fill="var(--color-primary-glow)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Empty />}
      </CardContent>
    </Card>
  );
}

function Empty() {
  return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة المحددة</div>;
}
