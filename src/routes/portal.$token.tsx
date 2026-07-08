import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPortalData } from "@/lib/portal.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, MessageSquareWarning, Building2 } from "lucide-react";
import { ORDER_STATUSES, QUOTATION_STATUSES, COMPLAINT_STATUSES, formatEGP, formatDate, labelOf } from "@/lib/crm-constants";
import logoAsset from "@/assets/elsewedy-logo.png.asset.json";

export const Route = createFileRoute("/portal/$token")({
  ssr: false,
  component: PortalPage,
  head: () => ({ meta: [{ title: "بوابة العميل — Elsewedy" }] }),
});

function PortalPage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", token],
    queryFn: () => getPortalData({ data: { token } }),
    retry: false,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" dir="rtl">جارٍ التحميل...</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <Card className="max-w-md"><CardContent className="p-8 text-center">
        <MessageSquareWarning className="h-12 w-12 mx-auto text-destructive mb-3" />
        <h2 className="font-bold">لا يمكن الوصول</h2>
        <p className="text-sm text-muted-foreground mt-2">{error instanceof Error ? error.message : "خطأ غير معروف"}</p>
      </CardContent></Card>
    </div>
  );
  if (!data?.client) return null;

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5 border border-border"><img src={logoAsset.url} alt="Elsewedy" className="h-8 w-auto" /></div>
          <div>
            <p className="text-sm font-bold">بوابة العميل — Elsewedy</p>
            <p className="text-xs text-muted-foreground">مرحباً {data.client.company_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-card"><CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center"><Building2 className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-xl font-bold">{data.client.company_name}</h1>
              <p className="text-sm text-muted-foreground">{data.client.contact_person} • {data.client.phone} • {data.client.city}</p>
            </div>
          </div>
        </CardContent></Card>

        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> طلباتك الحالية</h2>
          <div className="grid gap-3">
            {data.orders.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">لا توجد طلبات.</CardContent></Card>}
            {data.orders.map((o) => {
              const stages = (o.production_stages ?? []).slice().sort((a, b) => a.stage_order - b.stage_order);
              const done = stages.filter((s) => s.status === "done").length;
              const pct = stages.length ? Math.round((done / stages.length) * 100) : 0;
              return (
                <Card key={o.id} className="shadow-card"><CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{o.order_number}</span>
                      <h3 className="font-semibold">{o.title}</h3>
                    </div>
                    <Badge variant="secondary">{labelOf(ORDER_STATUSES, o.status)}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold ltr-nums">{pct}%</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">القيمة: </span><span className="font-semibold">{formatEGP(o.total_amount)}</span></div>
                    <div><span className="text-muted-foreground">المسدد: </span><span className="font-semibold">{formatEGP(o.paid_amount)}</span></div>
                    <div><span className="text-muted-foreground">التسليم: </span>{formatDate(o.delivery_date)}</div>
                    <div><span className="text-muted-foreground">فعلي: </span>{formatDate(o.actual_delivery_date)}</div>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> عروض الأسعار</h2>
          <Card className="shadow-card overflow-hidden"><CardContent className="p-0">
            {data.quotations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">لا توجد عروض.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>
                  <th className="text-right p-3">الرقم</th><th className="text-right p-3">المنتج</th>
                  <th className="text-right p-3">القيمة</th><th className="text-right p-3">الحالة</th>
                </tr></thead>
                <tbody>
                  {data.quotations.map((q) => (
                    <tr key={q.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">{q.quote_number}</td>
                      <td className="p-3">{q.product_type ?? "—"}</td>
                      <td className="p-3 font-semibold">{formatEGP(q.total_price)}</td>
                      <td className="p-3"><Badge variant="secondary">{labelOf(QUOTATION_STATUSES, q.status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent></Card>
        </section>

        {data.complaints.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><MessageSquareWarning className="h-5 w-5 text-primary" /> الشكاوى</h2>
            <div className="grid gap-2">
              {data.complaints.map((c) => (
                <Card key={c.id}><CardContent className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">{c.complaint_number} • {formatDate(c.created_at)}</p>
                  </div>
                  <Badge variant="secondary">{labelOf(COMPLAINT_STATUSES, c.status)}</Badge>
                </CardContent></Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
