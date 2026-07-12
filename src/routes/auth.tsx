import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoAsset from "@/assets/elsewedy-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("فشل تسجيل الدخول", { description: error.message });
      return;
    }
    toast.success("مرحبًا بك في Elsewedy Growth CRM");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background" dir="rtl" suppressHydrationWarning>
      <div className="hidden lg:flex flex-col justify-between p-10 gradient-brand text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative">
          <div className="bg-white rounded-2xl p-4 inline-block shadow-elegant">
            <img src={logoAsset.url} alt="مدحت السويدي للطباعة" className="h-16 w-auto" />
          </div>
        </div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Elsewedy Growth CRM</h1>
          <p className="text-lg text-white/90 leading-relaxed">
            منصة تشغيل تجارية متكاملة لإدارة رحلة العميل الكاملة — من العميل المحتمل حتى التسليم — لدار مدحت السويدي للطباعة والتغليف.
          </p>
        </div>
        <p className="relative text-xs text-white/70">© Medhat Elsewedy Print House</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-6">
            <img src={logoAsset.url} alt="مدحت السويدي للطباعة" className="h-14 w-auto" />
          </div>

          <Card className="shadow-elegant border-border/60">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
              <CardDescription>سجل دخولك للوصول إلى لوحة تحكم CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@elsewedy.com" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
                <p className="text-xs text-center text-muted-foreground pt-2">
                  إنشاء الحسابات غير متاح. برجاء التواصل مع مدير النظام.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
