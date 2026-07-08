import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: () => (
    <div>
      <PageHeader title="الحملات التسويقية" description="تتبع أداء الحملات، تكلفة العميل المحتمل، وعائد الاستثمار." />
      <Card className="shadow-card">
        <CardContent className="p-16 text-center">
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-brand items-center justify-center mb-4 shadow-elegant">
            <Megaphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <Badge variant="outline" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> المرحلة الثانية</Badge>
          <h3 className="text-lg font-semibold">وحدة الحملات التسويقية</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            سيتم إطلاق هذه الوحدة في المرحلة الثانية لتتضمن Meta، Google، LinkedIn، البريد الإلكتروني، SEO، المعارض والواتساب مع حساب ROI و CPL و CAC.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
