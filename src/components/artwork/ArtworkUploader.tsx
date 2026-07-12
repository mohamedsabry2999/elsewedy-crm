import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";
import {
  ARTWORK_EXTENSIONS, ARTWORK_MAX_MB, uploadArtworkFile, type ArtworkAssoc,
} from "@/lib/artwork";

type Props = {
  assoc: ArtworkAssoc;
  source?: "internal" | "portal";
  requireName?: boolean;
  onUploaded?: () => void;
  compact?: boolean;
};

export function ArtworkUploader({ assoc, source = "internal", requireName, onUploaded, compact }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
  };

  const submit = async () => {
    if (files.length === 0) return toast.error("اختر ملف واحد على الأقل");
    if (requireName && !name.trim()) return toast.error("أدخل اسمك");
    setBusy(true);
    let ok = 0, fail = 0;
    for (const f of files) {
      const res = await uploadArtworkFile({
        file: f, assoc, notes, source, uploaderName: name.trim() || undefined,
      });
      if (res.ok) ok++; else { fail++; toast.error(`${f.name}: ${res.error}`); }
    }
    setBusy(false);
    if (ok) toast.success(`تم رفع ${ok} ملف${fail ? ` (فشل ${fail})` : ""}`);
    setFiles([]); setNotes(""); if (!requireName) setName("");
    if (inputRef.current) inputRef.current.value = "";
    onUploaded?.();
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4 border border-dashed border-border rounded-lg p-4 bg-muted/20"}>
      {requireName && (
        <div className="space-y-1.5">
          <Label>اسمك / الشركة</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: شركة النور" />
        </div>
      )}

      <div
        className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-lg p-6 text-center cursor-pointer bg-background transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files); }}
      >
        <FileUp className="h-8 w-8 mx-auto text-primary mb-2" />
        <p className="text-sm font-medium">اسحب الملفات هنا أو انقر للاختيار</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          الصيغ: {ARTWORK_EXTENSIONS.join(", ")} — الحد الأقصى {ARTWORK_MAX_MB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ARTWORK_EXTENSIONS.map((e) => "." + e).join(",")}
          className="hidden"
          onChange={(e) => handlePick(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="text-xs space-y-1 bg-background rounded-md p-2 border">
          {files.map((f, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="truncate">{f.name}</span>
              <span className="text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(2)}MB</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1.5">
        <Label>ملاحظات (اختياري)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="تعليمات الطباعة، الألوان، القياسات..." />
      </div>

      <Button onClick={submit} disabled={busy || files.length === 0} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Upload className="h-4 w-4 ml-2" />}
        رفع الملفات
      </Button>
    </div>
  );
}
