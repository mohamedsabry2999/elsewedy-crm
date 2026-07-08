import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Phone, Mail, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LEAD_SOURCES,
  SERVICES,
  SECTORS,
  TEMPERATURES,
  LEAD_STATUSES,
  labelOf,
  formatDate,
} from "@/lib/crm-constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tempFilter, setTempFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", statusFilter, tempFilter],
    queryFn: async () => {
      let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as "new");
      if (tempFilter !== "all") q = q.eq("temperature", tempFilter as "hot");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف العميل المحتمل");
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const filtered = (leads ?? []).filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.company_name?.toLowerCase().includes(s) ||
      l.contact_person?.toLowerCase().includes(s) ||
      l.phone?.includes(search) ||
      l.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <PageHeader
        title="العملاء المحتملون"
        description="إدارة قاعدة العملاء المحتملين، تتبع مصادرهم، وتحويلهم إلى صفقات."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> عميل محتمل جديد
              </Button>
            </DialogTrigger>
            <LeadFormDialog onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <Card className="p-4 mb-4 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم، الشركة، الهاتف، أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tempFilter} onValueChange={setTempFilter}>
            <SelectTrigger><SelectValue placeholder="الحرارة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستويات</SelectItem>
              {TEMPERATURES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الشركة</TableHead>
              <TableHead className="text-right">جهة الاتصال</TableHead>
              <TableHead className="text-right">المصدر</TableHead>
              <TableHead className="text-right">الخدمة</TableHead>
              <TableHead className="text-right">القطاع</TableHead>
              <TableHead className="text-right">الحرارة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">المتابعة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                لا يوجد عملاء محتملون بعد. أضف أول عميل للبدء.
              </TableCell></TableRow>
            )}
            {filtered.map((l) => {
              const temp = TEMPERATURES.find((t) => t.value === l.temperature);
              return (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.company_name}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div>{l.contact_person ?? "—"}</div>
                      <div className="flex gap-2 text-[11px] text-muted-foreground ltr-nums">
                        {l.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{l.phone}</span>}
                        {l.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{labelOf(LEAD_SOURCES, l.source)}</TableCell>
                  <TableCell>{labelOf(SERVICES, l.service)}</TableCell>
                  <TableCell>{labelOf(SECTORS, l.sector)}</TableCell>
                  <TableCell><Badge variant="outline" className={cn("border", temp?.color)}>{temp?.label}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{labelOf(LEAD_STATUSES, l.status)}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(l.next_followup_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {l.whatsapp && (
                        <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-success"><MessageSquare className="h-4 w-4" /></Button>
                        </a>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("حذف هذا العميل المحتمل؟")) del.mutate(l.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

function LeadFormDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
    source: "website",
    service: "digital",
    sector: "food",
    temperature: "warm",
    status: "new",
    next_followup_date: "",
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        ...form,
        next_followup_date: form.next_followup_date || null,
        created_by: userRes.user?.id,
        assigned_to: userRes.user?.id,
        first_contact_date: new Date().toISOString().slice(0, 10),
      };
      const { error } = await supabase.from("leads").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إضافة العميل المحتمل");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["leads-by-source"] });
      onClose();
    },
    onError: (e: Error) => toast.error("فشلت الإضافة", { description: e.message }),
  });

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader>
        <DialogTitle>عميل محتمل جديد</DialogTitle>
        <DialogDescription>أدخل بيانات العميل المحتمل. سيتم اكتشاف التكرار عبر رقم الهاتف والبريد.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        <Field label="اسم الشركة *"><Input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
        <Field label="جهة الاتصال"><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></Field>
        <Field label="الهاتف"><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="واتساب"><Input dir="ltr" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        <Field label="البريد الإلكتروني"><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="المدينة"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="المصدر"><SelectRow value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={LEAD_SOURCES} /></Field>
        <Field label="الخدمة"><SelectRow value={form.service} onChange={(v) => setForm({ ...form, service: v })} options={SERVICES} /></Field>
        <Field label="القطاع"><SelectRow value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} options={SECTORS} /></Field>
        <Field label="الحرارة"><SelectRow value={form.temperature} onChange={(v) => setForm({ ...form, temperature: v })} options={TEMPERATURES} /></Field>
        <Field label="الحالة"><SelectRow value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={LEAD_STATUSES} /></Field>
        <Field label="موعد المتابعة القادم"><Input type="date" value={form.next_followup_date} onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <Field label="ملاحظات"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button onClick={() => create.mutate()} disabled={!form.company_name || create.isPending}>
          {create.isPending ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SelectRow({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
