import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Building2, MessageSquare, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SECTORS, CLIENT_TYPES, formatEGP, formatDate, labelOf } from "@/lib/crm-constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", type],
    queryFn: async () => {
      let q = supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (type !== "all") q = q.eq("client_type", type as "new");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (clients ?? []).filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.company_name?.toLowerCase().includes(s) || c.contact_person?.toLowerCase().includes(s) || c.phone?.includes(search);
  });

  return (
    <div>
      <PageHeader
        title="العملاء"
        description="قاعدة العملاء الكاملة مع سجل النشاطات والإيرادات."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> عميل جديد</Button>
            </DialogTrigger>
            <ClientForm onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <Card className="p-4 mb-4 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم، جهة الاتصال، أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="نوع العميل" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {CLIENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-16">جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center text-muted-foreground shadow-card">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>لا يوجد عملاء بعد. أضف عميلك الأول.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{c.company_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{c.contact_person ?? "—"}</p>
                  </div>
                  <Badge variant={c.client_type === "vip" ? "default" : "secondary"} className={c.client_type === "vip" ? "gradient-brand text-primary-foreground" : ""}>
                    {labelOf(CLIENT_TYPES, c.client_type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {c.phone && <div className="flex items-center gap-2 ltr-nums"><Phone className="h-3.5 w-3.5" />{c.phone}</div>}
                  {c.email && <div className="flex items-center gap-2 ltr-nums truncate"><Mail className="h-3.5 w-3.5" />{c.email}</div>}
                  {c.sector && <div>القطاع: {labelOf(SECTORS, c.sector)}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">إجمالي الإيراد</p>
                    <p className="text-sm font-semibold text-primary ltr-nums">{formatEGP(c.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">آخر طلب</p>
                    <p className="text-sm font-semibold">{formatDate(c.last_order_date)}</p>
                  </div>
                </div>
                {c.whatsapp && (
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="w-full gap-2 text-success border-success/30 hover:bg-success/10">
                      <MessageSquare className="h-3.5 w-3.5" /> واتساب
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  function ClientForm({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
      company_name: "", contact_person: "", phone: "", whatsapp: "", email: "",
      city: "", sector: "food", client_type: "new", notes: "",
    });
    const create = useMutation({
      mutationFn: async () => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await supabase.from("clients").insert({ ...form, created_by: userRes.user?.id, assigned_to: userRes.user?.id } as never);
        if (error) throw error;
      },
      onSuccess: () => { toast.success("تمت إضافة العميل"); qc.invalidateQueries({ queryKey: ["clients"] }); onClose(); },
      onError: (e: Error) => toast.error("فشل", { description: e.message }),
    });
    return (
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader><DialogTitle>عميل جديد</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">اسم الشركة *</Label><Input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">جهة الاتصال</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">الهاتف</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">واتساب</Label><Input dir="ltr" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">البريد</Label><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">المدينة</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">القطاع</Label>
            <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SECTORS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">نوع العميل</Label>
            <Select value={form.client_type} onValueChange={(v) => setForm({ ...form, client_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CLIENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">ملاحظات</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => create.mutate()} disabled={!form.company_name || create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    );
  }
}
