// Journey helpers — log activities + broadcast notifications on key transitions.
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db-any";

type Ref = {
  lead_id?: string | null;
  client_id?: string | null;
  deal_id?: string | null;
};

export async function logActivity(
  activity_type: string,
  subject: string,
  ref: Ref,
  body?: string,
) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("activities").insert({
    activity_type,
    subject,
    body: body ?? null,
    lead_id: ref.lead_id ?? null,
    client_id: ref.client_id ?? null,
    deal_id: ref.deal_id ?? null,
    created_by: u.user?.id,
  } as never);
}

export async function notifyRole(
  role: "sales_manager" | "pricing_team" | "production_planning" | "accounting" | "sales_person",
  kind: string,
  title: string,
  body: string,
  link?: string,
  entity?: { type?: string; id?: string },
) {
  await db.from("notifications").insert({
    role,
    kind,
    title,
    body,
    link: link ?? null,
    entity_type: entity?.type ?? null,
    entity_id: entity?.id ?? null,
  });
}

export async function notifyUser(
  user_id: string,
  kind: string,
  title: string,
  body: string,
  link?: string,
) {
  await db.from("notifications").insert({
    user_id,
    kind,
    title,
    body,
    link: link ?? null,
  });
}
