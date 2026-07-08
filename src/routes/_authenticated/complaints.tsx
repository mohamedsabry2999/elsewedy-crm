import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareWarning, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/complaints")({
  component: () => (
    <div>
      <PageHeader title="الشكاوى والجودة" description="تسجيل ومتابعة شكاوى العملاء حتى الحل النهائي." />
      <Card className="shadow-card">
        <CardContent className="p-16 text-center">
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-brand items-center justify-center mb-4 shadow-elegant">
            <MessageSquareWarning className="h-8 w-8 text-primary-foreground" />
          </div>
          <Badge variant="outline" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> المرحلة الثانية</Badge>
          <h3 className="text-lg font-semibold">وحدة الشكاوى</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            ستشمل تصنيف الشكاوى (تأخير، اختلاف ألوان، خامة، تشطيبات، نقص كمية...) مع تنبيهات التصعيد إذا تجاوزت 48 ساعة.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
