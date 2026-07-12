import { useEffect, useState } from "react";
import { db } from "@/lib/db-any";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Download, Check, X, Edit3, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ARTWORK_STATUS_LABELS, ARTWORK_STATUS_TONE,
  getSignedArtworkUrl, setArtworkStatus, deleteArtwork, type ArtworkRow,
} from "@/lib/artwork";
import { notifyRole, logActivity } from "@/lib/journey";

type Props = {
  filter: { client_id?: string; quotation_id?: string; order_id?: string; job_ticket_id?: string; lead_id?: string };
  canReview?: boolean;
  canDelete?: boolean;
  refreshKey?: number;
};

export function ArtworkList({ filter, canReview, canDelete, refreshKey }: Props) {
  const [rows, setRows] = useState<ArtworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<{ row: ArtworkRow; status: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = db.from("artwork_files").select("*").order("created_at", { ascending: false });
    for (const [k, v] of Object.entries(filter)) if (v) q = q.eq(k, v);
    const { data } = await q;
    setRows((data as ArtworkRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [JSON.stringify(filter), refreshKey]);

  const download = async (r: ArtworkRow) => {
    const url = await getSignedArtworkUrl(r.file_path);
    if (!url) return toast.error("تعذر توليد رابط التنزيل");
    window.open(url, "_blank");
  };

  const openReview = (row: ArtworkRow, status: string) => {
    setReviewing({ row, status });
    setReviewNotes(row.review_notes ?? "");
  };

  const confirmReview = async () => {
    if (!reviewing) return;
    setSaving(true);
    const { error } = await setArtworkStatus(reviewing.row.id, reviewing.status, reviewNotes);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`تم تحديث الحالة إلى ${ARTWORK_STATUS_LABELS[reviewing.status]}`);

    await logActivity(
      "artwork_review",
      `مراجعة تصميم: ${reviewing.row.file_name} → ${ARTWORK_STATUS_LABELS[reviewing.status]}`,
      { client_id: reviewing.row.client_id },
      reviewNotes,
    );
    if (reviewing.status === "approved" && reviewing.row.order_id) {
      await notifyRole("production_planning", "artwork_approved",
        "تصميم معتمد جاهز للإنتاج", reviewing.row.file_name,
        `/orders`, { type: "order", id: reviewing.row.order_id });
    }
    if (reviewing.status === "needs_revision" || reviewing.status === "rejected") {
      await notifyRole("sales_person", "artwork_rejected",
        `تصميم يحتاج تعديل: ${reviewing.row.file_name}`, reviewNotes || "",
        `/artwork`);
    }
    setReviewing(null); load();
  };

  const remove = async (r: ArtworkRow) => {
    if (!confirm(`حذف ${r.file_name}؟`)) return;
    const { error } = await deleteArtwork(r.id, r.file_path);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  if (loading) return <div className="text-sm text-muted-foreground p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline ml-2" />جارٍ التحميل...</div>;
  if (rows.length === 0) return <div className="text-sm text-muted-foreground p-6 text-center border border-dashed rounded-lg">لا توجد ملفات تصميم مرفوعة بعد.</div>;

  return (
    <>
      <div className="space-y-2">
        {rows.map((r) => {
          const tone = ARTWORK_STATUS_TONE[r.status] ?? "default";
          const toneClass =
            tone === "success" ? "bg-success/10 text-success border-success/30" :
            tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
            tone === "danger" ? "bg-destructive/10 text-destructive border-destructive/30" :
            tone === "info" ? "bg-primary/10 text-primary border-primary/30" :
            "bg-muted text-muted-foreground";
          return (
            <div key={r.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{r.file_name}</span>
                  <Badge variant="outline" className={toneClass}>{ARTWORK_STATUS_LABELS[r.status] ?? r.status}</Badge>
                  {r.source === "portal" && <Badge variant="outline" className="text-[10px]">من العميل</Badge>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                  <span>{r.uploaded_by_name ?? "غير معروف"}</span>
                  <span>{new Date(r.created_at).toLocaleString("ar-EG")}</span>
                  {r.file_size && <span>{(r.file_size / 1024 / 1024).toFixed(2)}MB</span>}
                </div>
                {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">📝 {r.notes}</p>}
                {r.review_notes && <p className="text-xs text-destructive mt-1 line-clamp-2">💬 {r.review_notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => download(r)} title="تنزيل"><Download className="h-4 w-4" /></Button>
                {canReview && (
                  <>
                    <Button size="icon" variant="ghost" className="text-success" onClick={() => openReview(r, "approved")} title="اعتماد"><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-warning" onClick={() => openReview(r, "needs_revision")} title="تعديل"><Edit3 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => openReview(r, "rejected")} title="رفض"><X className="h-4 w-4" /></Button>
                  </>
                )}
                {canDelete && (
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r)} title="حذف"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{reviewing && ARTWORK_STATUS_LABELS[reviewing.status]}: {reviewing?.row.file_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="ملاحظات المراجعة (اختياري إن كان الاعتماد نهائيًا)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>إلغاء</Button>
            <Button onClick={confirmReview} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
