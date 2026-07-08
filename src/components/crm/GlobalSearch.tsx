import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Users, Building2, FileText, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";

type Result = { kind: "lead" | "client" | "quote" | "order"; id: string; title: string; sub: string };

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const term = q.trim();
    const like = `%${term}%`;
    let cancel = false;
    (async () => {
      const [leads, clients, quotes, orders] = await Promise.all([
        supabase.from("leads").select("id, company_name, contact_person, phone, email").or(`company_name.ilike.${like},contact_person.ilike.${like},phone.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("clients").select("id, company_name, contact_person, phone, email").or(`company_name.ilike.${like},contact_person.ilike.${like},phone.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("quotations").select("id, quote_number, clients(company_name)").ilike("quote_number", like).limit(5),
        supabase.from("orders").select("id, order_number, title").or(`order_number.ilike.${like},title.ilike.${like}`).limit(5),
      ]);
      if (cancel) return;
      const out: Result[] = [];
      (leads.data ?? []).forEach((l) => out.push({ kind: "lead", id: l.id, title: l.company_name, sub: l.contact_person || l.phone || l.email || "" }));
      (clients.data ?? []).forEach((c) => out.push({ kind: "client", id: c.id, title: c.company_name, sub: c.contact_person || c.phone || c.email || "" }));
      (quotes.data ?? []).forEach((qu) => out.push({ kind: "quote", id: qu.id, title: qu.quote_number ?? qu.id.slice(0, 8), sub: qu.clients?.company_name ?? "" }));
      (orders.data ?? []).forEach((o) => out.push({ kind: "order", id: o.id, title: o.order_number ?? o.id.slice(0, 8), sub: o.title ?? "" }));
      setResults(out);
      setOpen(true);
    })();
    return () => { cancel = true; };
  }, [q]);

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    if (r.kind === "lead") navigate({ to: "/leads" });
    else if (r.kind === "client") navigate({ to: "/clients" });
    else if (r.kind === "quote") navigate({ to: "/quotations" });
    else navigate({ to: "/orders" });
  };

  const icon = { lead: Users, client: Building2, quote: FileText, order: Package } as const;
  const label = { lead: "ليد", client: "عميل", quote: "عرض", order: "طلب" } as const;

  return (
    <Popover open={open && results.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث عن عميل، عرض سعر، طلب، أو رقم..."
            className="pr-9 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-[380px] p-1" dir="rtl">
        <div className="max-h-80 overflow-auto">
          {results.map((r) => {
            const Icon = icon[r.kind];
            return (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => go(r)}
                className="w-full text-right flex items-center gap-3 p-2 rounded hover:bg-muted transition"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{label[r.kind]}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
