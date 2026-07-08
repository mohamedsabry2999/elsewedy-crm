import { createServerFn } from "@tanstack/react-start";

export const getPortalData = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tokenRow, error: tErr } = await supabaseAdmin
      .from("portal_tokens")
      .select("client_id, expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tokenRow) throw new Error("رابط غير صالح");
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) throw new Error("انتهت صلاحية الرابط");

    const [client, orders, quotations, complaints] = await Promise.all([
      supabaseAdmin.from("clients").select("id, company_name, contact_person, phone, email, city").eq("id", tokenRow.client_id).maybeSingle(),
      supabaseAdmin.from("orders").select("id, order_number, title, status, total_amount, paid_amount, delivery_date, actual_delivery_date, production_stages(stage_name, stage_order, status)").eq("client_id", tokenRow.client_id).order("created_at", { ascending: false }),
      supabaseAdmin.from("quotations").select("id, quote_number, product_type, total_price, status, delivery_date, created_at").eq("client_id", tokenRow.client_id).order("created_at", { ascending: false }),
      supabaseAdmin.from("complaints").select("id, complaint_number, subject, status, severity, created_at").eq("client_id", tokenRow.client_id).order("created_at", { ascending: false }),
    ]);

    return {
      client: client.data,
      orders: orders.data ?? [],
      quotations: quotations.data ?? [],
      complaints: complaints.data ?? [],
    };
  });
