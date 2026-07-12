import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: string;
  tone?: "default" | "primary" | "success" | "warning" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  return (
    <Card className="shadow-card border-border/60 hover:shadow-elegant transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-foreground ltr-nums">{value}</p>
            {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
            {trend && <p className="mt-2 text-xs font-medium text-success">{trend}</p>}
          </div>
          {Icon && (
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", tones[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

