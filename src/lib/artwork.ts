// Artwork upload helpers — Supabase storage bucket "artwork".
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db-any";

export const ARTWORK_BUCKET = "artwork";
export const ARTWORK_MAX_MB = 100;
export const ARTWORK_EXTENSIONS = [
  "pdf","ai","psd","eps","tif","tiff","jpg","jpeg","png","svg","zip","rar",
];

export const ARTWORK_STATUS_LABELS: Record<string, string> = {
  uploaded: "مرفوع",
  pending_review: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  needs_revision: "يحتاج تعديل",
};

export const ARTWORK_STATUS_TONE: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  uploaded: "info",
  pending_review: "warning",
  approved: "success",
  rejected: "danger",
  needs_revision: "warning",
};

export type ArtworkAssoc = {
  client_id?: string | null;
  quotation_id?: string | null;
  order_id?: string | null;
  job_ticket_id?: string | null;
  lead_id?: string | null;
};

export type ArtworkRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  notes: string | null;
  review_notes: string | null;
  uploaded_by_name: string | null;
  uploaded_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  client_id: string | null;
  quotation_id: string | null;
  order_id: string | null;
  job_ticket_id: string | null;
  lead_id: string | null;
  source: string | null;
};

export function validateArtworkFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ARTWORK_EXTENSIONS.includes(ext)) {
    return `صيغة الملف غير مسموحة. المسموح: ${ARTWORK_EXTENSIONS.join(", ")}`;
  }
  if (file.size > ARTWORK_MAX_MB * 1024 * 1024) {
    return `حجم الملف يتجاوز الحد الأقصى (${ARTWORK_MAX_MB}MB)`;
  }
  return null;
}

function slugify(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function uploadArtworkFile(opts: {
  file: File;
  assoc: ArtworkAssoc;
  notes?: string;
  uploaderName?: string;
  source?: "internal" | "portal";
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const invalid = validateArtworkFile(opts.file);
  if (invalid) return { ok: false, error: invalid };

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const scope =
    opts.assoc.order_id ? `orders/${opts.assoc.order_id}` :
    opts.assoc.quotation_id ? `quotations/${opts.assoc.quotation_id}` :
    opts.assoc.job_ticket_id ? `job-tickets/${opts.assoc.job_ticket_id}` :
    opts.assoc.client_id ? `clients/${opts.assoc.client_id}` :
    opts.assoc.lead_id ? `leads/${opts.assoc.lead_id}` :
    "unassigned";

  const path = `${scope}/${Date.now()}_${slugify(opts.file.name)}`;

  const up = await supabase.storage.from(ARTWORK_BUCKET).upload(path, opts.file, {
    contentType: opts.file.type || "application/octet-stream",
    upsert: false,
  });
  if (up.error) return { ok: false, error: up.error.message };

  const insert = await db.from("artwork_files").insert({
    file_name: opts.file.name,
    file_path: path,
    file_size: opts.file.size,
    mime_type: opts.file.type || null,
    status: opts.source === "portal" ? "pending_review" : "uploaded",
    notes: opts.notes ?? null,
    uploaded_by: uid,
    uploaded_by_name: opts.uploaderName ?? userData.user?.email ?? null,
    source: opts.source ?? "internal",
    client_id: opts.assoc.client_id ?? null,
    quotation_id: opts.assoc.quotation_id ?? null,
    order_id: opts.assoc.order_id ?? null,
    job_ticket_id: opts.assoc.job_ticket_id ?? null,
    lead_id: opts.assoc.lead_id ?? null,
  }).select("id").single();

  if (insert.error) {
    await supabase.storage.from(ARTWORK_BUCKET).remove([path]);
    return { ok: false, error: insert.error.message };
  }
  return { ok: true, id: (insert.data as { id: string }).id };
}

export async function getSignedArtworkUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(ARTWORK_BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export async function setArtworkStatus(id: string, status: string, review_notes?: string) {
  const { data: userData } = await supabase.auth.getUser();
  return db.from("artwork_files").update({
    status,
    review_notes: review_notes ?? null,
    reviewed_by: userData.user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
}

export async function deleteArtwork(id: string, path: string) {
  await supabase.storage.from(ARTWORK_BUCKET).remove([path]);
  return db.from("artwork_files").delete().eq("id", id);
}
