import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type AnyRow } from "@/lib/db-any";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KNOWLEDGE_CATEGORIES, formatDate, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/knowledge")({ component: KnowledgePage });

function KnowledgePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const { data: rows, isLoading } = useQuery<AnyRow[]>({
    queryKey: ["knowledge", category],
    queryFn: async () => {
      let q = db.from("knowledge_articles").select("*").order("created_at", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnyRow[];
    },
  });

  const filtered = (rows ?? []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(r.title ?? "").toLowerCase().includes(q) || String(r.content ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        title="قاعدة المعرفة"
        description="مقالات ودلائل وأدوات داخلية لفريق المبيعات — من مواصفات المنتجات إلى الردود على الاعتراضات."
        actions={
          <div className="flex gap-2">
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {KNOWLEDGE_CATEGORIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> مقال جديد</Button></DialogTrigger>
              <ArticleForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["knowledge"] })} />
            </Dialog>
          </div>
        }
      />

      {isLoading && <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>}
      {!isLoading && filtered.length === 0 && (
        <Card className="shadow-card"><CardContent className="py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" /> لا توجد مقالات.
        </CardContent></Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <Card key={r.id} className="shadow-card hover:shadow-elegant transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-base">{r.title}</h3>
                <Badge variant="outline" className="shrink-0">{labelOf(KNOWLEDGE_CATEGORIES, r.category)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{r.content}</p>
              <p className="text-[11px] text-muted-foreground pt-1 border-t">{formatDate(r.created_at)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ArticleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", category: "products", content: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await db.from("knowledge_articles").insert({
        title: form.title,
        category: form.category,
        content: form.content,
        created_by: userRes.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم النشر"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl" dir="rtl">
      <DialogHeader><DialogTitle>مقال جديد</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5"><Label className="text-xs">العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">القسم</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{KNOWLEDGE_CATEGORIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">المحتوى *</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.title || !form.content || create.isPending}>نشر</Button>
      </DialogFooter>
    </DialogContent>
  );
}
