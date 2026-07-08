import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Phone, Mail, UserX, Copy, Tag, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/data-quality")({
  component: DataQualityPage,
});

type Lead = { id: string; company_name: string; contact_person: string | null; phone: string | null; email: string | null; source: string | null; assigned_to: string | null; sector: string | null; tags: string[] | null };
type Client = { id: string; company_name: string; contact_person: string | null; phone: string | null; email: string | null; sector: string | null; tags: string[] | null };

const validPhone = (p: string | null) => !!p && /^\+?\d{8,}$/.test(p.replace(/\s/g, ""));
const validEmail = (e: string | null) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function DataQualityPage() {
  const qc = useQueryClient();

  const { data: leads } = useQuery({
    queryKey: ["dq-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, company_name, contact_person, phone, email, source, assigned_to, sector, tags");
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });
  const { data: clients } = useQuery({
    queryKey: ["dq-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, company_name, contact_person, phone, email, sector, tags");
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });

  const L = leads ?? [];
  const C = clients ?? [];

  // duplicates by phone
  const phoneMap = new Map<string, string[]>();
  [...L, ...C].forEach((r) => {
    if (r.phone) {
      const k = r.phone.replace(/\s/g, "");
      phoneMap.set(k, [...(phoneMap.get(k) ?? []), r.id]);
    }
  });
  const dupPhones = Array.from(phoneMap.entries()).filter(([, v]) => v.length > 1);

  const issues = {
    leadsNoPhone: L.filter((l) => !l.phone).length,
    leadsInvalidPhone: L.filter((l) => l.phone && !validPhone(l.phone)).length,
    leadsNoEmail: L.filter((l) => !l.email).length,
    leadsInvalidEmail: L.filter((l) => l.email && !validEmail(l.email)).length,
    leadsNoOwner: L.filter((l) => !l.assigned_to).length,
    leadsNoSource: L.filter((l) => !l.source).length,
    leadsNoSector: L.filter((l) => !l.sector).length,
    clientsNoPhone: C.filter((c) => !c.phone).length,
    clientsNoEmail: C.filter((c) => !c.email).length,
    clientsNoSector: C.filter((c) => !c.sector).length,
    dupPhones: dupPhones.length,
  };

  const total = L.length + C.length;
  const problems = Object.values(issues).reduce((a, b) => a + b, 0);
  const score = total ? Math.max(0, 100 - Math.round((problems / (total * 4)) * 100)) : 100;

  const badLeads = L.filter((l) => !l.phone || !l.email || !l.assigned_to || !l.sector || (l.phone && !validPhone(l.phone)) || (l.email && !validEmail(l.email)));
  const badClients = C.filter((c) => !c.phone || !c.email || !c.sector);

  const assignSelf = async (table: "leads" | "clients", id: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from(table).update({ assigned_to: u.user.id } as never).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم الإسناد");
      qc.invalidateQueries();
    }
  };

  return (
    <div>
      <PageHeader
        title="جودة البيانات"
        description="اكتشف السجلات الناقصة، الأرقام غير الصالحة، والمكررات وأصلحها بضغطة."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Card className="shadow-card sm:col-span-3 lg:col-span-2">
          <CardContent className="p-5 text-center">
            <div className="text-4xl font-black ltr-nums text-primary">{score}%</div>
            <p className="text-xs text-muted-foreground mt-1">مؤشر جودة البيانات</p>
            <p className="text-[11px] text-muted-foreground mt-2 ltr-nums">{problems} مشكلة على {total} سجل</p>
          </CardContent>
        </Card>
        <StatMini icon={Phone} label="ليدز بلا هاتف" v={issues.leadsNoPhone} tone="warning" />
        <StatMini icon={Phone} label="أرقام غير صالحة" v={issues.leadsInvalidPhone + 0} tone="destructive" />
        <StatMini icon={Mail} label="ليدز بلا بريد" v={issues.leadsNoEmail} tone="warning" />
        <StatMini icon={UserX} label="بلا مسؤول" v={issues.leadsNoOwner} tone="destructive" />
        <StatMini icon={Copy} label="أرقام مكررة" v={issues.dupPhones} tone="info" />
        <StatMini icon={Tag} label="ليدز بلا مصدر" v={issues.leadsNoSource} tone="warning" />
        <StatMini icon={Tag} label="ليدز بلا قطاع" v={issues.leadsNoSector} tone="warning" />
        <StatMini icon={Phone} label="عملاء بلا هاتف" v={issues.clientsNoPhone} tone="warning" />
        <StatMini icon={Mail} label="عملاء بلا بريد" v={issues.clientsNoEmail} tone="warning" />
        <StatMini icon={Tag} label="عملاء بلا قطاع" v={issues.clientsNoSector} tone="warning" />
      </div>

      {dupPhones.length > 0 && (
        <Card className="shadow-card mb-6 border-info/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-info" />
              <h3 className="font-bold">أرقام متكررة عبر السجلات</h3>
            </div>
            <div className="space-y-1 text-sm">
              {dupPhones.slice(0, 10).map(([phone, ids]) => (
                <div key={phone} className="flex justify-between border-b border-border py-1.5">
                  <span className="font-mono ltr-nums">{phone}</span>
                  <span className="text-muted-foreground text-xs">مكرر في {ids.length} سجل</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-bold">ليدز تحتاج إصلاح ({badLeads.length})</h3>
            </div>
            <IssueTable rows={badLeads} onFix={(id) => assignSelf("leads", id)} showFix />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-bold">عملاء تحتاج إصلاح ({badClients.length})</h3>
            </div>
            <IssueTable rows={badClients as unknown as Lead[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, v, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; v: number; tone: "warning" | "destructive" | "info" }) {
  const color = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-info";
  return (
    <Card className="shadow-card"><CardContent className="p-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-[11px] text-muted-foreground flex-1">{label}</p>
      </div>
      <p className={`text-2xl font-bold ltr-nums mt-1 ${v > 0 ? color : "text-muted-foreground"}`}>{v}</p>
    </CardContent></Card>
  );
}

function IssueTable({ rows, onFix, showFix }: { rows: Lead[]; onFix?: (id: string) => void; showFix?: boolean }) {
  return (
    <div className="max-h-96 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الشركة</TableHead>
            <TableHead className="text-right">المشاكل</TableHead>
            {showFix && <TableHead className="text-right">إجراء</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 30).map((r) => {
            const probs: string[] = [];
            if (!r.phone) probs.push("لا يوجد هاتف");
            else if (!validPhone(r.phone)) probs.push("رقم غير صالح");
            if (!r.email) probs.push("لا يوجد بريد");
            else if (!validEmail(r.email)) probs.push("بريد غير صالح");
            if ("assigned_to" in r && !r.assigned_to) probs.push("بلا مسؤول");
            if (!r.sector) probs.push("بلا قطاع");
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.company_name}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {probs.map((p) => <Badge key={p} variant="outline" className="text-[10px] text-warning border-warning/40">{p}</Badge>)}
                </TableCell>
                {showFix && onFix && (
                  <TableCell>
                    {"assigned_to" in r && !r.assigned_to && (
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => onFix(r.id)}>إسناد لي</Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={showFix ? 3 : 2} className="text-center py-6 text-muted-foreground text-sm">لا توجد مشاكل 🎉</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
