import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: () => (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-lg text-center p-8 rounded-2xl border bg-card shadow-card">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">إنشاء الحسابات غير متاح</h1>
        <p className="text-muted-foreground text-sm mb-4">برجاء التواصل مع مدير النظام لإنشاء حساب لك.</p>
        <Link to="/auth" className="text-primary hover:underline text-sm">العودة إلى تسجيل الدخول</Link>
      </div>
    </div>
  ),
});
