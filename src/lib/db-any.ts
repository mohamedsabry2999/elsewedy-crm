// Helper: newly created tables aren't reflected in generated Supabase types yet.
// Use this loose client for those tables until types regenerate.
import { supabase } from "@/integrations/supabase/client";
/* eslint-disable @typescript-eslint/no-explicit-any */
export const db = supabase as any;
export type AnyRow = Record<string, any>;
