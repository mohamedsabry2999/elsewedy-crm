import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArtworkUploader } from "@/components/artwork/ArtworkUploader";
import logoAsset from "@/assets/elsewedy-logo.png.asset.json";

export const Route = createFileRoute("/artwork-upload")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "رفع ملفات التصميم — مدحت السويدي للطباعة" },
      { name: "description", content: "بوابة عملاء دار مدحت السويدي لرفع ملفات التصميم للطباعة." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ArtworkPortalPage,
});

function ArtworkPortalPage() {
  const [ref, setRef] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div dir="rtl" className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="h-14 w-14 mx-auto text-success mb-3" />
            <h2 className="text-xl font-bold mb-2">تم استلام ملفاتك</h2>
            <p className="text-sm text-muted-foreground">سيقوم فريق مدحت السويدي بمراجعة التصميم والتواصل معك قريبًا.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="bg-white rounded-lg p-2 shadow"><img src={logoAsset.url} alt="Elsewedy" className="h-10 w-auto" /></div>
          <div>
            <h1 className="font-bold text-lg">دار مدحت السويدي للطباعة</h1>
            <p className="text-xs text-muted-foreground">بوابة رفع ملفات التصميم</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>رفع ملفات التصميم</CardTitle>
            <CardDescription>
              ارفع ملفات الطباعة (PDF, AI, PSD, EPS, TIFF, JPG, PNG...) وسيتم مراجعتها من قسم ما قبل الطباعة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!started ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>رقم الطلب / عرض السعر (اختياري)</Label>
                  <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="مثال: Q-2025-001" />
                </div>
                <Button onClick={() => setStarted(true)} className="w-full">متابعة</Button>
              </div>
            ) : (
              <ArtworkUploader
                assoc={{}}
                source="portal"
                requireName
                onUploaded={() => setDone(true)}
              />
            )}
            {ref && started && <p className="text-[11px] text-muted-foreground">📌 الرقم المرجعي: {ref} (سيُربط يدويًا من الفريق)</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
