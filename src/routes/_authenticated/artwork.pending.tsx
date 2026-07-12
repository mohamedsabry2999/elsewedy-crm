import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db-any";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Link2, ArrowLeft } from "lucide-react";
import { ArtworkList } from "@/components/artwork/ArtworkList";
import { useRoles } from "@/hooks/useRoles";
import { can } from "@/lib/permissions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/artwork/pending")({
  component: PendingArtworkPage,
});

function PendingArtworkPage() {
  const { roles } = useRoles();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState<Array<{ id: string; file_name: string; uploaded_by_name: string | null; created_at: string; notes: string | null; file_path: string }>>([]);
  const [linkState, setLinkState] = useState<Record<string, { quotation_id?: string; order_id?: string; client_id?: string }>>({});

  const load = async () => {
    const { data } = await db.from("artwork_files").select("*")
      .is("client_id", null).is("quotation_id", null).is("order_id", null).is("job_ticket_id", null)
      .eq("source", "portal")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [refreshKey]);

  const linkTo = async (id: string) => {
    const st = linkState[id] ?? {};
    if (!st.quotation_id && !st.order_id && !st.client_id) return toast.error("أدخل معرف واحد على الأقل");
    const { error } = await db.from("artwork_files").update({ ...st }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الربط"); setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-warning" />ملفات تصميم غير مرتبطة</h1>
          <p className="text-sm text-muted-foreground mt-1">ملفات مرفوعة من بوابة العميل ولم تُربط بعد بطلب أو عرض سعر.</p>
        </div>
        <Button asChild variant="outline"><Link to="/artwork"><ArrowLeft className="h-4 w-4 ml-2" />رجوع</Link></Button>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد ملفات غير مرتبطة.</CardContent></Card>
      ) : (
        rows.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" />{r.file_name}</CardTitle>
              <p className="text-xs text-muted-foreground">من: {r.uploaded_by_name ?? "غير معروف"} — {new Date(r.created_at).toLocaleString("ar-EG")}</p>
              {r.notes && <p className="text-xs mt-1">📝 {r.notes}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <ArtworkList
                filter={{}}
                canReview={can(roles, "artwork", "approve")}
                canDelete={can(roles, "artwork", "delete")}
                refreshKey={refreshKey}
                statusFilter="all"
                search={r.file_name}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border-t pt-3">
                <div className="space-y-1">
                  <Label className="text-xs">معرف عرض السعر</Label>
                  <Input placeholder="Quotation UUID" value={linkState[r.id]?.quotation_id ?? ""} onChange={(e) => setLinkState((s) => ({ ...s, [r.id]: { ...s[r.id], quotation_id: e.target.value || undefined } }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">معرف الطلب</Label>
                  <Input placeholder="Order UUID" value={linkState[r.id]?.order_id ?? ""} onChange={(e) => setLinkState((s) => ({ ...s, [r.id]: { ...s[r.id], order_id: e.target.value || undefined } }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">معرف العميل</Label>
                  <Input placeholder="Client UUID" value={linkState[r.id]?.client_id ?? ""} onChange={(e) => setLinkState((s) => ({ ...s, [r.id]: { ...s[r.id], client_id: e.target.value || undefined } }))} />
                </div>
                <Button onClick={() => linkTo(r.id)}>ربط</Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
