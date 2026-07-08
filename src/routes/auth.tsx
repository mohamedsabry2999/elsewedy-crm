import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [fullName, setFullName] = useState("");

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("فشل إنشاء الحساب", { description: error.message });
      return;
    }
    toast.success("تم إنشاء الحساب بنجاح");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background" dir="rtl" suppressHydrationWarning>

      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between p-10 gradient-brand text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative">
          <div className="bg-white rounded-2xl p-4 inline-block shadow-elegant">
            <img src={logoAsset.url} alt="مدحت السويدي للطباعة" className="h-16 w-auto" />
          </div>
        </div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Elsewedy Growth CRM
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            منصة تشغيل تجارية متكاملة لإدارة رحلة العميل الكاملة — من العميل المحتمل حتى التسليم — لدار مدحت السويدي للطباعة والتغليف.
          </p>
          <ul className="text-sm text-white/80 space-y-2 pt-4">
            <li>• إدارة العملاء المحتملين وخط أنابيب المبيعات</li>
            <li>• عروض الأسعار وطلبات الإنتاج</li>
            <li>• متابعة الحملات التسويقية والشكاوى</li>
            <li>• تقارير تنفيذية شاملة</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/70">© Medhat Elsewedy Print House</p>
      </div>

      {/* Auth side */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-6">
            <img src={logoAsset.url} alt="مدحت السويدي للطباعة" className="h-14 w-auto" />
          </div>

          <Card className="shadow-elegant border-border/60">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">مرحبًا بعودتك</CardTitle>
              <CardDescription>سجل دخولك للوصول إلى لوحة تحكم CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 pt-4">
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
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسم المستخدم" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email2">البريد الإلكتروني</Label>
                      <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password2">كلمة المرور</Label>
                      <Input id="password2" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
