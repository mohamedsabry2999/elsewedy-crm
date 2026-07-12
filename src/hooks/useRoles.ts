import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { can as capCheck, canViewModule, type ModuleKey, type Capability } from "@/lib/permissions";

let cache: { userId: string | null; roles: string[] } = { userId: null, roles: [] };
const listeners = new Set<(roles: string[]) => void>();

async function loadRoles(userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  cache = { userId, roles };
  listeners.forEach((l) => l(roles));
  return roles;
}

export function useRoles() {
  const [roles, setRoles] = useState<string[]>(cache.roles);
  const [loading, setLoading] = useState(cache.roles.length === 0);

  useEffect(() => {
    let alive = true;
    const listener = (r: string[]) => alive && setRoles(r);
    listeners.add(listener);

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      if (!uid) { setRoles([]); setLoading(false); return; }
      if (cache.userId !== uid) {
        const r = await loadRoles(uid);
        if (alive) { setRoles(r); setLoading(false); }
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) { cache = { userId: null, roles: [] }; setRoles([]); }
      else if (s.user.id !== cache.userId) loadRoles(s.user.id);
    });
    return () => { alive = false; listeners.delete(listener); sub.subscription.unsubscribe(); };
  }, []);

  return { roles, loading };
}

export function useCan(module: ModuleKey, capability: Capability = "view") {
  const { roles } = useRoles();
  return capCheck(roles, module, capability);
}

export function useCanView(module: ModuleKey) {
  const { roles } = useRoles();
  return canViewModule(roles, module);
}
