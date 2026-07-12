import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db-any";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ExternalLink, Copy } from "lucide-react";
import { ArtworkList } from "@/components/artwork/ArtworkList";
import { ARTWORK_STATUS_LABELS } from "@/lib/artwork";
import { useRoles } from "@/hooks/useRoles";
import { can } from "@/lib/permissions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/artwork")({
  component: ArtworkPage,
});

function ArtworkPage() {
  const { roles } = useRoles();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Array<{ id: string; file_name: string; status: string; created_at: string; source: string | null; uploaded_by_name: string | null; file_path: string; client_id: string | null; quotation_id: string | null; order_id: string | null }>>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    let q = db.from("artwork_files").select("*").order("created_at", { ascending: false }).limit(500);
    if (status !== "all") q = q.eq("status", status);
    if (search) q = q.ilike("file_name", `%${search}%`);
    const { data } = await q;
    setRows(data ?? []);
    const { data: all } = await db.from("artwork_files").select("status");
    const c: Record<string, number> = {};
    (all ?? []).forEach((r: { status: string }) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    setCounts(c);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, search]);

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/artwork-upload` : "";
  const copyPortal = () => { navigator.clipboard.writeText(portalUrl); toast.success("تم نسخ رابط البوابة"); };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />ملفات التصميم (Artwork)</h1>
          <p className="text-sm text-muted-foreground mt-1">مراجعة واعتماد ملفات الطباعة المرفوعة من العملاء والفريق الداخلي.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyPortal}><Copy className="h-4 w-4 ml-2" />نسخ رابط بوابة العميل</Button>
          <Button asChild variant="outline"><a href="/artwork-upload" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 ml-2" />فتح البوابة</a></Button>
          <Button asChild><Link to="/_authenticated/artwork/pending" as any>الملفات غير المرتبطة</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["uploaded","pending_review","approved","needs_revision","rejected"] as const).map((k) => (
          <Card key={k} className="cursor-pointer hover:shadow-elegant transition-shadow" onClick={() => setStatus(k)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{ARTWORK_STATUS_LABELS[k]}</p>
              <p className="text-2xl font-bold mt-1">{counts[k] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">القائمة</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="بحث باسم الملف..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(ARTWORK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList><TabsTrigger value="list">قائمة</TabsTrigger></TabsList>
            <TabsContent value="list">
              <ArtworkListInline
                rows={rows}
                canReview={can(roles, "artwork", "approve")}
                canDelete={can(roles, "artwork", "delete")}
                onChange={load}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ArtworkListInline({ rows, canReview, canDelete, onChange }: { rows: Array<{ id: string; status: string; created_at: string; file_name: string; source: string | null; uploaded_by_name: string | null }>; canReview: boolean; canDelete: boolean; onChange: () => void }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">لا نتائج.</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <ArtworkRow key={r.id} id={r.id} canReview={canReview} canDelete={canDelete} onChange={onChange} />
      ))}
    </div>
  );
}

function ArtworkRow({ id, canReview, canDelete, onChange }: { id: string; canReview: boolean; canDelete: boolean; onChange: () => void }) {
  return <ArtworkList filter={{ }} canReview={canReview} canDelete={canDelete} refreshKey={0} key={id} />;
}
