import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  company_name: z.string().trim().min(2).max(200),
  contact_person: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().min(6).max(40),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
  city: z.string().trim().max(100).optional().nullable(),
  service: z.string().trim().max(100).optional().nullable(),
  sector: z.string().trim().max(100).optional().nullable(),
  quantity: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
  website: z.string().max(200).optional().nullable(), // honeypot
});

function normalizeEgyptPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("20")) return "+" + digits;
  if (digits.startsWith("01") && digits.length === 11) return "+2" + digits;
  if (digits.startsWith("1") && digits.length === 10) return "+20" + digits;
  return digits;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/lead-request")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const parsed = schema.safeParse(raw);
          if (!parsed.success) {
            return Response.json(
              { ok: false, error: "بيانات غير صحيحة", issues: parsed.error.issues },
              { status: 400, headers: CORS },
            );
          }
          const body = parsed.data;

          // Honeypot: silently accept spam
          if (body.website && body.website.trim().length > 0) {
            return Response.json({ ok: true, duplicate: false }, { headers: CORS });
          }

          const phone = normalizeEgyptPhone(body.phone);
          const whatsapp = body.whatsapp ? normalizeEgyptPhone(body.whatsapp) : phone;
          const email = body.email && body.email.length > 0 ? body.email.toLowerCase() : null;

          const notesParts: string[] = [];
          if (body.quantity) notesParts.push(`الكمية المطلوبة: ${body.quantity}`);
          if (body.notes) notesParts.push(body.notes);
          const notes = notesParts.join("\n\n") || null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Duplicate detection: same phone OR email within last 90 days
          const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
          let dupQuery = supabaseAdmin
            .from("leads")
            .select("id, company_name, created_at")
            .gte("created_at", ninetyDaysAgo)
            .limit(1);
          if (email) {
            dupQuery = dupQuery.or(`phone.eq.${phone},email.eq.${email}`);
          } else {
            dupQuery = dupQuery.eq("phone", phone);
          }
          const { data: existing } = await dupQuery;

          if (existing && existing.length > 0) {
            // Log activity on existing lead
            await supabaseAdmin.from("activities").insert({
              lead_id: existing[0].id,
              activity_type: "note",
              subject: "طلب خارجي جديد (تكرار)",
              description: `تم استلام طلب جديد من نفس العميل عبر النموذج العام.\nالخدمة: ${body.service ?? "—"}\n${notes ?? ""}`.trim(),
            } as never);
            await supabaseAdmin.from("notifications").insert({
              role: "sales_manager",
              kind: "external_request",
              title: `طلب متكرر من ${body.company_name}`,
              body: `عميل موجود مسبقاً أرسل طلباً جديداً${body.service ? ` — ${body.service}` : ""}`,
              link: "/leads",
              entity_type: "lead",
              entity_id: existing[0].id,
            } as never);
            return Response.json(
              { ok: true, duplicate: true, leadId: existing[0].id },
              { headers: CORS },
            );
          }


          const { data: inserted, error } = await supabaseAdmin
            .from("leads")
            .insert({
              company_name: body.company_name,
              contact_person: body.contact_person ?? null,
              phone,
              whatsapp,
              email,
              city: body.city ?? null,
              country: "مصر",
              source: "website",
              service: body.service ?? null,
              sector: body.sector ?? null,
              temperature: "warm",
              status: "new",
              notes,
              tags: ["طلب خارجي"],
            } as never)
            .select("id")
            .single();

          if (error) throw error;

          return Response.json({ ok: true, duplicate: false, leadId: inserted.id }, { headers: CORS });
        } catch (err) {
          console.error("[lead-request]", err);
          return Response.json(
            { ok: false, error: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى." },
            { status: 500, headers: CORS },
          );
        }
      },
    },
  },
});
