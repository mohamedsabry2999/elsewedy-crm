import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  KanbanSquare,
  CheckSquare,
  FileText,
  BarChart3,
  Megaphone,
  MessageSquareWarning,
  Menu,
  LogOut,
  Search,
  Bell,
  Package,
  Factory,
  Bot,
  Zap,
  ExternalLink,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import logoAsset from "@/assets/elsewedy-logo.png.asset.json";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; group?: string };

const NAV: NavItem[] = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, group: "الرئيسية" },
  { to: "/leads", label: "العملاء المحتملون", icon: Users, group: "المبيعات" },
  { to: "/clients", label: "العملاء", icon: Building2, group: "المبيعات" },
  { to: "/pipeline", label: "خط أنابيب المبيعات", icon: KanbanSquare, group: "المبيعات" },
  { to: "/tasks", label: "المهام والمتابعات", icon: CheckSquare, group: "المبيعات" },
  { to: "/quotations", label: "عروض الأسعار", icon: FileText, group: "المبيعات" },
  { to: "/orders", label: "الطلبات", icon: Package, group: "التشغيل" },
  { to: "/production", label: "تتبع الإنتاج", icon: Factory, group: "التشغيل" },
  { to: "/complaints", label: "الشكاوى", icon: MessageSquareWarning, group: "التشغيل" },
  { to: "/campaigns", label: "الحملات التسويقية", icon: Megaphone, group: "التسويق" },
  { to: "/automation", label: "الأتمتة", icon: Zap, group: "الذكاء" },
  { to: "/assistant", label: "المساعد الذكي", icon: Bot, group: "الذكاء" },
  { to: "/reports", label: "التقارير", icon: BarChart3, group: "التحليلات" },
  { to: "/portal-links", label: "بوابة العميل", icon: ExternalLink, group: "التحليلات" },
  { to: "/import", label: "استيراد Excel", icon: Upload, group: "الإدارة" },
];


export function AppShell({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setFullName((data.user?.user_metadata?.full_name as string) ?? data.user?.email ?? "");
    });
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen flex bg-muted/30" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
        <SidebarInner />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
              <SidebarInner />
            </SheetContent>
          </Sheet>

          <GlobalSearch />

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-auto py-1.5 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {(fullName || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{fullName || "المستخدم"}</span>
                  <span className="text-[11px] text-muted-foreground">{email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>الحساب</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 ml-2" /> تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarInner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="bg-white rounded-lg p-1.5">
          <img src={logoAsset.url} alt="Elsewedy" className="h-8 w-auto" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-sidebar-primary-foreground">Elsewedy CRM</p>
          <p className="text-[10px] text-sidebar-foreground/60">Growth Platform</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {Array.from(new Set(NAV.map((n) => n.group ?? ""))).map((group) => (
          <div key={group} className="space-y-1">
            {group && (
              <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group}
              </p>
            )}
            {NAV.filter((n) => (n.group ?? "") === group).map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/50">
        الإصدار 1.0 — المرحلة الأولى
      </div>
    </>
  );
}
