import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Copy, RefreshCcw, Download, Undo2 } from "lucide-react";
import * as XLSX from "xlsx";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { parseSheet, suggestMapping, processRows, fieldsFor, LEAD_FIELDS, CLIENT_FIELDS, type ModuleKey } from "@/lib/smart-import";
import { formatDate } from "@/lib/crm-constants";

export const Route = createFileRoute("/_authenticated/import")({
  component: ImportPage,
});

type Step = "upload" | "map" | "preview" | "done";

function ImportPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [module, setModule] = useState<ModuleKey>("leads");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  const fields = fieldsFor(module);
  const processed = useMemo(
    () => (step !== "upload" ? processRows(rows, mapping, module) : []),
    [rows, mapping, module, step],
  );

  const stats = useMemo(() => {
    const errors = processed.filter((r) => r.errors.length).length;
    const warnings = processed.filter((r) => !r.errors.length && r.warnings.length).length;
    const dups = processed.filter((r) => r.duplicate).length;
    const ok = processed.length - errors;
    return { total: processed.length, errors, warnings, dups, ok };
  }, [processed]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const { headers, rows } = parseSheet(buf);
      if (!rows.length) {
        toast.error("الملف فارغ");
        return;
      }
      setHeaders(headers);
      setRows(rows);
      setMapping(suggestMapping(headers, module));
      setStep("map");
    } catch (e) {
      toast.error("تعذر قراءة الملف", { description: (e as Error).message });
    }
  };

  const changeModule = (m: ModuleKey) => {
    setModule(m);
    if (headers.length) setMapping(suggestMapping(headers, m));
  };

  const runImport = async () => {
    setImporting(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      toast.error("يجب تسجيل الدخول");
      setImporting(false);
      return;
    }

    const valid = processed.filter((r) => !r.errors.length && !r.duplicate);
    const payload = valid.map((r) => {
      const base = { ...r.data } as Record<string, unknown>;
      if (module === "leads") {
        base.company_name = base.company_name ?? base.contact_person ?? "بدون اسم";
        base.source = base.source ?? "website";
        base.temperature = "warm";
        base.status = "new";
        base.created_by = uid;
        base.assigned_to = uid;
      } else {
        base.client_type = "new";
        base.created_by = uid;
        base.assigned_to = uid;
      }
      return base;
    });

    const errors: unknown[] = [];
    const createdIds: string[] = [];
    // insert in chunks of 100
    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      const { data, error } = await supabase.from(module).insert(chunk as never).select("id");
      if (error) errors.push({ chunk: i, message: error.message });
      else if (data) createdIds.push(...data.map((d: { id: string }) => d.id));
    }

    await supabase.from("import_logs").insert({
      user_id: uid,
      file_name: fileName,
      target_module: module,
      total_rows: processed.length,
      inserted_count: createdIds.length,
      updated_count: 0,
      skipped_count: stats.dups,
      error_count: stats.errors + errors.length,
      mapping,
      created_ids: createdIds,
      errors,
      status: errors.length ? "partial" : "completed",
    } as never);

    setImporting(false);
    toast.success(`تم استيراد ${createdIds.length} سجل`);
    qc.invalidateQueries();
    setStep("done");
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  const downloadTemplate = () => {
    const cols = fields.map((f) => f.label);
    const sampleLead = ["الاسم التجاري ش.م.م", "أحمد محمد", "01012345678", "01012345678", "info@example.com", "facebook_ads", "digital", "food", "القاهرة", "مصر", "عميل مهتم بالطباعة الديجيتال", "2026-01-15"];
    const sampleClient = ["الشركة العربية", "محمود علي", "01098765432", "01098765432", "sales@arabco.eg", "pharma", "الإسكندرية", "مصر", "عميل متكرر"];
    const ws = XLSX.utils.aoa_to_sheet([cols, module === "leads" ? sampleLead : sampleClient]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, module);
    XLSX.writeFile(wb, `${module}-template.xlsx`);
  };

  return (
    <div>
      <PageHeader
        title="استيراد ذكي من Excel"
        description="ارفع ملف Excel قديم، سنكتشف الأعمدة تلقائياً، ننظف الأرقام، ونمنع التكرار قبل الحفظ."
        actions={
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> تحميل نموذج {module === "leads" ? "الليدز" : "العملاء"}
          </Button>
        }
      />

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        {[
          { k: "upload", n: "1. رفع الملف" },
          { k: "map", n: "2. مطابقة الأعمدة" },
          { k: "preview", n: "3. المعاينة" },
          { k: "done", n: "4. الاستيراد" },
        ].map((s, i) => (
          <div key={s.k} className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full font-medium ${step === s.k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s.n}</span>
            {i < 3 && <span className="text-muted-foreground">←</span>}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <Card className="shadow-card">
          <CardContent className="p-8">
            <div className="max-w-lg mx-auto space-y-4 text-center">
              <div className="flex justify-center gap-3 mb-3">
                <Button variant={module === "leads" ? "default" : "outline"} onClick={() => changeModule("leads")}>ليدز</Button>
                <Button variant={module === "clients" ? "default" : "outline"} onClick={() => changeModule("clients")}>عملاء</Button>
              </div>
              <label className="block border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary hover:bg-muted/30 transition">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">اسحب الملف هنا أو اضغط للتصفح</p>
                <p className="text-xs text-muted-foreground">.xlsx / .xls / .csv — النظام يفهم أسماء أعمدة عربية أو إنجليزية</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card className="shadow-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">الملف: <span className="font-mono ltr-nums">{fileName}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{rows.length} صف • {headers.length} عمود • هدف: {module === "leads" ? "الليدز" : "العملاء"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="gap-1"><RefreshCcw className="h-3.5 w-3.5" /> ملف آخر</Button>
                <Button onClick={() => setStep("preview")}>التالي: معاينة</Button>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عمود الملف</TableHead>
                    <TableHead className="text-right">قيمة نموذجية</TableHead>
                    <TableHead className="text-right">الحقل المستهدف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((h) => (
                    <TableRow key={h}>
                      <TableCell className="font-medium">{h}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{String(rows[0]?.[h] ?? "")}</TableCell>
                      <TableCell>
                        <Select value={mapping[h] ?? "__ignore__"} onValueChange={(v) => setMapping({ ...mapping, [h]: v })}>
                          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__ignore__">— تجاهل —</SelectItem>
                            {fields.map((f) => (
                              <SelectItem key={f.key} value={f.key}>
                                {f.label} {f.required && <span className="text-destructive">*</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatChip label="إجمالي" value={stats.total} icon={FileSpreadsheet} />
            <StatChip label="جاهز" value={stats.ok - stats.dups} icon={CheckCircle2} tone="success" />
            <StatChip label="تحذيرات" value={stats.warnings} icon={AlertTriangle} tone="warning" />
            <StatChip label="تكرار" value={stats.dups} icon={Copy} tone="info" />
            <StatChip label="أخطاء" value={stats.errors} icon={XCircle} tone="destructive" />
          </div>

          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="flex justify-between items-center p-4 border-b">
                <p className="text-sm font-medium">أول 50 صف — تحقق قبل الاستيراد</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("map")}>رجوع</Button>
                  <Button onClick={runImport} disabled={importing || stats.ok - stats.dups === 0}>
                    {importing ? "جارٍ الاستيراد..." : `استيراد ${stats.ok - stats.dups} سجل`}
                  </Button>
                </div>
              </div>
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      {fields.slice(0, 5).map((f) => <TableHead key={f.key} className="text-right">{f.label}</TableHead>)}
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processed.slice(0, 50).map((r) => (
                      <TableRow key={r.index} className={r.errors.length ? "bg-destructive/5" : r.duplicate ? "bg-info/5" : r.warnings.length ? "bg-warning/5" : ""}>
                        <TableCell className="text-xs text-muted-foreground ltr-nums">{r.index + 1}</TableCell>
                        <TableCell>
                          {r.errors.length ? <Badge variant="destructive">خطأ</Badge> :
                           r.duplicate ? <Badge variant="secondary">مكرر</Badge> :
                           r.warnings.length ? <Badge className="bg-warning/15 text-warning border-warning/30">تحذير</Badge> :
                           <Badge className="bg-success/15 text-success border-success/30">جاهز</Badge>}
                        </TableCell>
                        {fields.slice(0, 5).map((f) => (
                          <TableCell key={f.key} className="text-xs truncate max-w-[160px]">{String(r.data[f.key] ?? "—")}</TableCell>
                        ))}
                        <TableCell className="text-xs text-muted-foreground">{[...r.errors, ...r.warnings].join(" • ") || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "done" && (
        <Card className="shadow-card">
          <CardContent className="p-10 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold">تم الاستيراد بنجاح</h2>
            <p className="text-muted-foreground">تفقّد السجلات الجديدة في وحدة {module === "leads" ? "الليدز" : "العملاء"}.</p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" onClick={reset}>استيراد ملف آخر</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ImportHistory />
    </div>
  );
}

function StatChip({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone?: "success" | "warning" | "info" | "destructive" }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : tone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <Card className="shadow-card"><CardContent className="p-3 flex items-center gap-3">
      <Icon className={`h-6 w-6 ${color}`} />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-xl font-bold ltr-nums">{value}</p>
      </div>
    </CardContent></Card>
  );
}

function ImportHistory() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["import-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("import_logs").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rollback = async (id: string, module: string, ids: string[]) => {
    if (!ids.length) return;
    if (!confirm(`حذف ${ids.length} سجل تم إنشاؤه في هذا الاستيراد؟`)) return;
    const { error } = await supabase.from(module as "leads").delete().in("id", ids);
    if (error) return toast.error(error.message);
    await supabase.from("import_logs").update({ status: "rolled_back", created_ids: [] } as never).eq("id", id);
    toast.success("تم التراجع عن الاستيراد");
    qc.invalidateQueries({ queryKey: ["import-logs"] });
  };

  return (
    <Card className="shadow-card mt-6">
      <CardContent className="p-5">
        <h3 className="font-bold mb-3">سجل عمليات الاستيراد الأخيرة</h3>
        {!data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا يوجد استيرادات سابقة.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الملف</TableHead>
                  <TableHead className="text-right">الوحدة</TableHead>
                  <TableHead className="text-right">مُدرج</TableHead>
                  <TableHead className="text-right">مُتخطى</TableHead>
                  <TableHead className="text-right">أخطاء</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((l) => {
                  const ids = (l.created_ids as string[]) ?? [];
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{formatDate(l.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]">{l.file_name}</TableCell>
                      <TableCell>{l.target_module}</TableCell>
                      <TableCell className="ltr-nums text-success font-semibold">{l.inserted_count}</TableCell>
                      <TableCell className="ltr-nums">{l.skipped_count}</TableCell>
                      <TableCell className="ltr-nums text-destructive">{l.error_count}</TableCell>
                      <TableCell><Badge variant="secondary">{l.status}</Badge></TableCell>
                      <TableCell>
                        {l.status !== "rolled_back" && ids.length > 0 && (
                          <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => rollback(l.id, l.target_module, ids)}>
                            <Undo2 className="h-3.5 w-3.5" /> تراجع
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
