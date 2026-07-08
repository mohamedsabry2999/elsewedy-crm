import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ExternalLink, Copy, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-links")({
  component: PortalLinksPage,
});

function PortalLinksPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows } = useQuery({
    queryKey: ["portal_tokens"],
    queryFn: async () => (await supabase.from("portal_tokens").select("*, clients(company_name)").order("created_at", { ascending: false })).data ?? [],
  });

  const remove = async (id: string) => {
    if (!confirm("حذف الرابط؟")) return;
    await supabase.from("portal_tokens").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["portal_tokens"] });
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const publicRequestUrl = `${origin}/request`;

  return (
    <div>
      <PageHeader
        title="بوابة العميل"
        description="أنشئ رابطاً آمناً للعميل يعرض حالة طلباته وعروض الأسعار بدون تسجيل دخول."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> رابط جديد</Button></DialogTrigger>
            <NewLink onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["portal_tokens"] })} />
          </Dialog>
        }
      />

      <Card className="shadow-card p-4 mb-6 border-primary/30 bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">رابط الطلبات العام</p>
            <p className="text-xs text-muted-foreground mt-1">
              شاركه على موقعك ووسائل التواصل — كل طلب يصلك مباشرة في وحدة العملاء المحتملين.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-[11px] font-mono bg-background px-2 py-1.5 rounded border max-w-[260px] truncate" dir="ltr">
              {publicRequestUrl}
            </code>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(publicRequestUrl); toast.success("تم النسخ"); }}>
              <Copy className="h-3.5 w-3.5" /> نسخ
            </Button>
            <Button size="sm" variant="default" className="gap-1.5" asChild>
              <a href={publicRequestUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> فتح
              </a>
            </Button>
          </div>
        </div>
      </Card>


      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">الرابط</TableHead>
              <TableHead className="text-right">تنتهي في</TableHead>
              <TableHead className="text-right">أُنشئ</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                <ExternalLink className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد روابط بعد.
              </TableCell></TableRow>
            )}
            {(rows ?? []).map((r) => {
              const url = `${origin}/portal/${r.token}`;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.clients?.company_name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[11px] max-w-md truncate" dir="ltr">{url}</TableCell>
                  <TableCell className="text-xs">{r.expires_at ? formatDate(r.expires_at) : "—"}</TableCell>
                  <TableCell className="text-xs">{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(url); toast.success("تم النسخ"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function NewLink({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [clientId, setClientId] = useState("");
  const [days, setDays] = useState("30");
  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id, company_name").order("company_name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2, 8);
      const expires_at = days ? new Date(Date.now() + Number(days) * 86400000).toISOString() : null;
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("portal_tokens").insert({
        client_id: clientId, token, expires_at, created_by: userRes.user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم إنشاء الرابط"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <DialogContent dir="rtl">
      <DialogHeader><DialogTitle>رابط بوابة عميل جديد</DialogTitle></DialogHeader>
      <div className="grid gap-3 py-2">
        <div className="space-y-1.5"><Label className="text-xs">العميل *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{(clients ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">صالح لعدد أيام</Label><Input type="number" dir="ltr" value={days} onChange={(e) => setDays(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!clientId || create.isPending}>إنشاء</Button>
      </DialogFooter>
    </DialogContent>
  );
}
