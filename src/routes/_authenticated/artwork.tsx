import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ExternalLink, Copy, AlertTriangle } from "lucide-react";
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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/artwork-upload` : "";
  const copyPortal = () => { navigator.clipboard.writeText(portalUrl); toast.success("تم نسخ رابط البوابة"); };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />ملفات التصميم (Artwork)</h1>
          <p className="text-sm text-muted-foreground mt-1">مراجعة واعتماد ملفات الطباعة المرفوعة من العملاء والفريق الداخلي.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={copyPortal}><Copy className="h-4 w-4 ml-2" />نسخ رابط بوابة العميل</Button>
          <Button asChild variant="outline"><a href="/artwork-upload" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 ml-2" />فتح البوابة</a></Button>
          <Button asChild variant="secondary"><Link to="/artwork/pending"><AlertTriangle className="h-4 w-4 ml-2" />غير مرتبط</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["uploaded","pending_review","approved","needs_revision","rejected"] as const).map((k) => (
          <Card key={k} className={`cursor-pointer hover:shadow-elegant transition-shadow ${status === k ? "border-primary" : ""}`} onClick={() => setStatus(status === k ? "all" : k)}>
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
          <ArtworkList
            filter={{}}
            statusFilter={status}
            search={search}
            canReview={can(roles, "artwork", "approve")}
            canDelete={can(roles, "artwork", "delete")}
            refreshKey={refreshKey}
            onCountsChange={setCounts}
          />
          <div className="mt-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>تحديث</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
