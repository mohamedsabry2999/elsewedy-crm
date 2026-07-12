import { useRoles } from "@/hooks/useRoles";
import { canViewModule, moduleFromPath, type ModuleKey } from "@/lib/permissions";
import { useRouterState, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

export function RequireModule({ module, children }: { module?: ModuleKey; children: ReactNode }) {
  const { roles, loading } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const mod = module ?? moduleFromPath(pathname);
  if (loading) return null;
  if (!mod) return <>{children}</>;
  if (canViewModule(roles, mod)) return <>{children}</>;
  return <Denied />;
}

function Denied() {
  return (
    <div dir="rtl" className="max-w-lg mx-auto mt-20 text-center p-8 rounded-2xl border bg-card shadow-card">
      <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h1 className="text-xl font-bold mb-2">لا تملك صلاحية الوصول</h1>
      <p className="text-muted-foreground text-sm mb-4">
        هذه الصفحة غير متاحة لدورك الحالي. تواصل مع مدير النظام لطلب الصلاحية.
      </p>
      <Link to="/" className="text-primary hover:underline text-sm">العودة إلى لوحة التحكم</Link>
    </div>
  );
}
