import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES, SECTORS } from "@/lib/crm-constants";
import logoAsset from "@/assets/elsewedy-logo.png.asset.json";
import { toast } from "sonner";

export const Route = createFileRoute("/request")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "طلب عرض سعر — مدحت السويدي للطباعة والتغليف" },
      {
        name: "description",
        content:
          "أرسل طلبك لدار مدحت السويدي للطباعة والتغليف — طباعة ديجيتال وأوفست، تغليف، ملصقات وتشطيبات.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: RequestPage,
});

type FormState = {
  company_name: string;
  contact_person: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  service: string;
  sector: string;
  quantity: string;
  notes: string;
  website: string; // honeypot
};

const INITIAL: FormState = {
  company_name: "",
  contact_person: "",
  phone: "",
  whatsapp: "",
  email: "",
  city: "",
  service: "",
  sector: "",
  quantity: "",
  notes: "",
  website: "",
};

function RequestPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.company_name.trim().length < 2 || form.phone.trim().length < 6) {
      toast.error("الرجاء إدخال اسم الشركة ورقم الهاتف");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/lead-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "فشل الإرسال");
      setDone({ duplicate: !!json.duplicate });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12" dir="rtl">
        <Card className="w-full max-w-lg shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <CardTitle className="text-2xl">تم استلام طلبك بنجاح</CardTitle>
            <CardDescription className="text-base pt-2">
              {done.duplicate
                ? "لدينا طلب سابق منك، تم تسجيل طلبك الجديد وسيتواصل معك فريق المبيعات قريباً."
                : "شكراً لك، سيتواصل معك فريق المبيعات خلال ٢٤ ساعة عمل."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setForm(INITIAL);
                setDone(null);
              }}
            >
              إرسال طلب آخر
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* Brand header */}
      <div className="gradient-brand text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 flex items-center gap-5">
          <div className="bg-white rounded-xl p-3 shadow-elegant shrink-0">
            <img src={logoAsset.url} alt="مدحت السويدي" className="h-14 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              أرسل طلبك — مدحت السويدي للطباعة والتغليف
            </h1>
            <p className="text-white/85 text-sm mt-1">
              طباعة ديجيتال وأوفست، تغليف، ملصقات، تشطيبات وطلبات تصدير.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-16">
        <Card className="shadow-elegant border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">تفاصيل الطلب</CardTitle>
            <CardDescription>
              املأ البيانات التالية وسيصلك عرض سعر من فريق المبيعات في أقرب وقت.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-5">
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                  />
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="اسم الشركة *" required>
                  <Input
                    required
                    value={form.company_name}
                    onChange={(e) => set("company_name", e.target.value)}
                  />
                </Field>
                <Field label="اسم المسؤول">
                  <Input
                    value={form.contact_person}
                    onChange={(e) => set("contact_person", e.target.value)}
                  />
                </Field>

                <Field label="رقم الهاتف *" required>
                  <Input
                    required
                    dir="ltr"
                    placeholder="01xxxxxxxxx"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="واتساب (اختياري)">
                  <Input
                    dir="ltr"
                    placeholder="نفس رقم الهاتف إن ترك فارغاً"
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </Field>

                <Field label="البريد الإلكتروني">
                  <Input
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="المحافظة / المدينة">
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="مثال: القاهرة"
                  />
                </Field>

                <Field label="الخدمة المطلوبة">
                  <Select value={form.service} onValueChange={(v) => set("service", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="طبيعة النشاط">
                  <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القطاع" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="الكمية المطلوبة">
                  <Input
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    placeholder="مثال: 5000 علبة"
                  />
                </Field>
                <div />
              </div>

              <Field label="ملاحظات / تفاصيل إضافية">
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="المقاسات، الخامات، تاريخ التسليم، أي متطلبات خاصة..."
                />
              </Field>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> إرسال الطلب
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                بإرسالك هذا النموذج توافق على تواصل فريق المبيعات معك بخصوص طلبك.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
