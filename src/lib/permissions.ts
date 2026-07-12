// Central role-based permissions matrix (client-side).
// The database enforces its own rules via RLS — this file drives UI visibility only.

export type AppRole =
  | "super_admin"
  | "top_management"
  | "sales_manager"
  | "sales_person"
  | "marketing_manager"
  | "pricing_team"
  | "production"
  | "production_planning" // legacy alias
  | "quality_control"
  | "finance"
  | "accounting" // legacy alias
  | "customer_service"
  | "viewer";

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير النظام",
  top_management: "الإدارة العليا",
  sales_manager: "مدير المبيعات",
  sales_person: "مندوب مبيعات",
  marketing_manager: "مدير التسويق",
  pricing_team: "فريق التسعير",
  production: "الإنتاج",
  production_planning: "تخطيط الإنتاج",
  quality_control: "ضبط الجودة",
  finance: "المالية",
  accounting: "المحاسبة",
  customer_service: "خدمة العملاء",
  viewer: "قارئ فقط",
};

// Modules keyed by URL segment (leading path).
export type ModuleKey =
  | "dashboard" | "leads" | "clients" | "pipeline" | "tasks" | "meetings" | "samples"
  | "pricing-requests" | "quotations" | "approvals"
  | "orders" | "production" | "deliveries" | "complaints"
  | "payments" | "campaigns" | "competitors" | "automation"
  | "assistant" | "knowledge" | "reports" | "portal-links"
  | "import" | "data-quality" | "artwork";


export type Capability =
  | "view" | "create" | "edit" | "delete"
  | "export" | "import" | "approve" | "assign"
  | "merge" | "rollback" | "manage_settings"
  | "view_financial" | "view_internal_notes" | "view_portal"
  | "manage_automation" | "manage_knowledge";

// Module → roles that can VIEW the page. super_admin always allowed.
const MODULE_VIEW: Record<ModuleKey, AppRole[]> = {
  dashboard: ["top_management","sales_manager","sales_person","marketing_manager","pricing_team","production","production_planning","quality_control","finance","accounting","customer_service","viewer"],
  leads: ["top_management","sales_manager","sales_person","marketing_manager","viewer"],
  clients: ["top_management","sales_manager","sales_person","marketing_manager","finance","accounting","customer_service","production","production_planning","quality_control","viewer"],
  pipeline: ["top_management","sales_manager","sales_person","marketing_manager","viewer"],
  tasks: ["top_management","sales_manager","sales_person","customer_service","production","production_planning","quality_control","viewer"],
  meetings: ["top_management","sales_manager","sales_person","viewer"],
  samples: ["top_management","sales_manager","sales_person","production","production_planning","viewer"],

  "pricing-requests": ["top_management","sales_manager","sales_person","pricing_team","viewer"],
  quotations: ["top_management","sales_manager","sales_person","pricing_team","finance","accounting","viewer"],
  approvals: ["top_management","sales_manager","pricing_team","finance","accounting","viewer"],

  orders: ["top_management","sales_manager","sales_person","production","production_planning","quality_control","finance","accounting","customer_service","viewer"],
  production: ["top_management","sales_manager","production","production_planning","quality_control","viewer"],
  deliveries: ["top_management","sales_manager","sales_person","production","production_planning","customer_service","viewer"],
  complaints: ["top_management","sales_manager","sales_person","quality_control","customer_service","viewer"],

  payments: ["top_management","sales_manager","finance","accounting","viewer"],
  campaigns: ["top_management","marketing_manager","viewer"],
  competitors: ["top_management","sales_manager","marketing_manager","viewer"],
  automation: ["top_management","marketing_manager"],

  assistant: ["top_management","sales_manager","sales_person","marketing_manager","pricing_team","production","production_planning","quality_control","finance","accounting","customer_service"],
  knowledge: ["top_management","sales_manager","sales_person","marketing_manager","pricing_team","production","production_planning","quality_control","finance","accounting","customer_service","viewer"],
  reports: ["top_management","sales_manager","marketing_manager","finance","accounting","viewer"],
  "portal-links": ["top_management","sales_manager","sales_person","customer_service"],

  import: ["sales_manager","marketing_manager"],
  "data-quality": ["top_management","sales_manager","marketing_manager","viewer"],
};

// Capability → roles allowed (per module bucket)
// Structure: capabilityByModule[module][capability] = roles[]
type CapMap = Partial<Record<Capability, AppRole[]>>;

const DEFAULT_CAPS: Record<ModuleKey, CapMap> = {
  dashboard: { view: MODULE_VIEW.dashboard },

  leads: {
    view: MODULE_VIEW.leads,
    create: ["sales_manager","sales_person","marketing_manager"],
    edit: ["sales_manager","sales_person","marketing_manager"],
    delete: ["sales_manager"],
    assign: ["sales_manager","marketing_manager"],
    merge: ["sales_manager"],
    export: ["top_management","sales_manager","marketing_manager"],
    import: ["sales_manager","marketing_manager"],
  },
  clients: {
    view: MODULE_VIEW.clients,
    create: ["sales_manager","sales_person","marketing_manager"],
    edit: ["sales_manager","sales_person","customer_service"],
    delete: [],
    assign: ["sales_manager"],
    merge: ["sales_manager"],
    export: ["top_management","sales_manager","marketing_manager","finance","accounting"],
    view_financial: ["top_management","sales_manager","finance","accounting"],
  },
  pipeline: {
    view: MODULE_VIEW.pipeline,
    create: ["sales_manager","sales_person"],
    edit: ["sales_manager","sales_person"],
    delete: ["sales_manager"],
  },
  tasks: {
    view: MODULE_VIEW.tasks,
    create: ["sales_manager","sales_person","customer_service","production","production_planning","quality_control"],
    edit: ["sales_manager","sales_person","customer_service","production","production_planning","quality_control"],
    delete: ["sales_manager"],
  },
  meetings: { view: MODULE_VIEW.meetings, create: ["sales_manager","sales_person"], edit: ["sales_manager","sales_person"], delete: ["sales_manager"] },
  samples: { view: MODULE_VIEW.samples, create: ["sales_manager","sales_person","production"], edit: ["sales_manager","sales_person","production"], delete: ["sales_manager"] },

  "pricing-requests": {
    view: MODULE_VIEW["pricing-requests"],
    create: ["sales_manager","sales_person"],
    edit: ["sales_manager","sales_person","pricing_team"],
    delete: [],
  },
  quotations: {
    view: MODULE_VIEW.quotations,
    create: ["sales_manager","sales_person","pricing_team"],
    edit: ["sales_manager","sales_person","pricing_team"],
    delete: ["sales_manager"],
    approve: ["sales_manager"],
    view_financial: ["top_management","sales_manager","sales_person","pricing_team","finance","accounting"],
  },
  approvals: { view: MODULE_VIEW.approvals, approve: ["sales_manager","pricing_team","finance","accounting"] },

  orders: {
    view: MODULE_VIEW.orders,
    create: ["sales_manager","sales_person"],
    edit: ["sales_manager","sales_person","production","production_planning","quality_control","finance","accounting"],
    delete: [],
    view_financial: ["top_management","sales_manager","finance","accounting"],
  },
  production: { view: MODULE_VIEW.production, edit: ["sales_manager","production","production_planning","quality_control"], create: ["sales_manager","production"], delete: [] },
  deliveries: { view: MODULE_VIEW.deliveries, create: ["sales_manager","production","production_planning","customer_service"], edit: ["sales_manager","production","production_planning","customer_service"], delete: [] },
  complaints: { view: MODULE_VIEW.complaints, create: ["sales_manager","sales_person","quality_control","customer_service"], edit: ["sales_manager","quality_control","customer_service"], delete: [] },

  payments: { view: MODULE_VIEW.payments, create: ["finance","accounting"], edit: ["finance","accounting"], delete: [], view_financial: ["top_management","sales_manager","finance","accounting"] },
  campaigns: { view: MODULE_VIEW.campaigns, create: ["marketing_manager"], edit: ["marketing_manager"], delete: ["marketing_manager"] },
  competitors: { view: MODULE_VIEW.competitors, create: ["sales_manager","marketing_manager"], edit: ["sales_manager","marketing_manager"], delete: ["sales_manager"] },
  automation: { view: MODULE_VIEW.automation, manage_automation: ["marketing_manager"], create: ["marketing_manager"], edit: ["marketing_manager"], delete: ["marketing_manager"] },

  assistant: { view: MODULE_VIEW.assistant },
  knowledge: { view: MODULE_VIEW.knowledge, create: ["sales_manager","marketing_manager"], edit: ["sales_manager","marketing_manager"], delete: ["sales_manager"], manage_knowledge: ["sales_manager","marketing_manager"] },
  reports: { view: MODULE_VIEW.reports, export: ["top_management","sales_manager","marketing_manager","finance","accounting"] },
  "portal-links": { view: MODULE_VIEW["portal-links"], create: ["sales_manager","sales_person","customer_service"], view_portal: ["sales_manager","sales_person","customer_service"] },

  import: { view: MODULE_VIEW.import, import: ["sales_manager","marketing_manager"], rollback: ["sales_manager","marketing_manager"] },
  "data-quality": { view: MODULE_VIEW["data-quality"], merge: ["sales_manager","marketing_manager"] },
};

export function can(roles: string[], module: ModuleKey, capability: Capability = "view"): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.includes("super_admin")) return true;
  const allowed = DEFAULT_CAPS[module]?.[capability] ?? [];
  return roles.some((r) => (allowed as string[]).includes(r));
}

export function canViewModule(roles: string[], module: ModuleKey) {
  return can(roles, module, "view");
}

// Extract module key from a pathname like "/leads/123" or "/"
export function moduleFromPath(pathname: string): ModuleKey | null {
  if (pathname === "/" || pathname === "") return "dashboard";
  const seg = pathname.replace(/^\/+/, "").split("/")[0] as ModuleKey;
  return (seg in DEFAULT_CAPS ? seg : null);
}
