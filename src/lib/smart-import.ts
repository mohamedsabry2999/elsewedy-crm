// Smart Excel import engine: column detection, phone normalization, validation.
import * as XLSX from "xlsx";

export type ModuleKey = "leads" | "clients";

export type FieldDef = {
  key: string;
  label: string;
  aliases: string[]; // lowercased match candidates (Arabic + English)
  required?: boolean;
  type?: "text" | "phone" | "email" | "number" | "date" | "enum";
  enumValues?: Record<string, string>; // free text → canonical value
};

const NAME_ALIASES = ["name", "full name", "contact", "contact name", "الاسم", "اسم", "اسم العميل", "المسؤول", "الشخص المسؤول"];
const COMPANY_ALIASES = ["company", "company name", "client", "client name", "customer", "customer name", "organization", "الشركة", "اسم الشركة", "المؤسسة", "الجهة"];
const PHONE_ALIASES = ["phone", "mobile", "whatsapp", "tel", "telephone", "cell", "رقم", "الهاتف", "موبايل", "المحمول", "تليفون", "واتساب", "رقم الواتساب", "رقم الهاتف", "جوال"];
const EMAIL_ALIASES = ["email", "e-mail", "mail", "الايميل", "البريد", "البريد الإلكتروني", "ايميل"];
const SOURCE_ALIASES = ["source", "lead source", "channel", "المصدر", "مصدر", "جاي منين", "من اين", "من أين"];
const SERVICE_ALIASES = ["service", "product", "requirement", "الخدمة", "نوع الخدمة", "المطلوب", "طلب العميل", "المنتج"];
const SECTOR_ALIASES = ["industry", "sector", "business", "القطاع", "المجال", "النشاط", "نوع النشاط"];
const CITY_ALIASES = ["city", "location", "area", "governorate", "المحافظة", "المدينة", "العنوان", "المنطقة"];
const NOTES_ALIASES = ["notes", "note", "comment", "comments", "description", "ملاحظات", "تفاصيل", "الوصف"];
const TITLE_ALIASES = ["title", "position", "job title", "المسمى", "الوظيفة", "المنصب"];
const DATE_ALIASES = ["date", "created", "lead date", "التاريخ", "تاريخ", "تاريخ التواصل", "تاريخ الإنشاء"];

const LEAD_SOURCE_MAP: Record<string, string> = {
  facebook: "facebook_ads", fb: "facebook_ads", meta: "facebook_ads", instagram: "facebook_ads",
  "فيسبوك": "facebook_ads", "فيس بوك": "facebook_ads", "ميتا": "facebook_ads", "انستجرام": "facebook_ads",
  google: "google_ads", "جوجل": "google_ads", "google ads": "google_ads",
  website: "website", "موقع": "website", "الموقع": "website",
  whatsapp: "whatsapp", "واتساب": "whatsapp", "واتس": "whatsapp",
  linkedin: "linkedin", "لينكدإن": "linkedin", "لينكد ان": "linkedin",
  exhibition: "exhibition", "معرض": "exhibition", "معارض": "exhibition",
  referral: "referral", "توصية": "referral", "ترشيح": "referral",
  "walk in": "walk_in", "walkin": "walk_in", "زيارة": "walk_in",
  "cold call": "cold_call", "اتصال": "cold_call", "اتصال بارد": "cold_call",
  email: "email_campaign", "بريد": "email_campaign",
  seo: "seo",
};

const SERVICE_MAP: Record<string, string> = {
  digital: "digital", "ديجيتال": "digital", "رقمية": "digital",
  offset: "offset", "اوفست": "offset", "أوفست": "offset",
  packaging: "packaging", "تغليف": "packaging", "علب": "packaging", "كرتون": "packaging",
  labels: "labels", "ملصقات": "labels", "ليبل": "labels", "استيكر": "labels",
  finishing: "finishing", "تشطيب": "finishing", "تشطيبات": "finishing",
  export: "export", "تصدير": "export",
};

const SECTOR_MAP: Record<string, string> = {
  food: "food", "اغذية": "food", "أغذية": "food", "طعام": "food",
  pharma: "pharma", "ادوية": "pharma", "أدوية": "pharma", "صيدلة": "pharma", pharmaceutical: "pharma",
  cosmetics: "cosmetics", "تجميل": "cosmetics", "مستحضرات": "cosmetics",
  fmcg: "fmcg", "سلع": "fmcg", "استهلاكية": "fmcg",
  agency: "agencies", agencies: "agencies", "وكالة": "agencies", "وكالات": "agencies",
  apparel: "apparel", "ملابس": "apparel",
  "real estate": "real_estate", "عقارات": "real_estate", "عقاري": "real_estate",
  ecommerce: "ecommerce", "تجارة الكترونية": "ecommerce", "تجارة إلكترونية": "ecommerce",
  export: "export", "تصدير": "export",
};

export const LEAD_FIELDS: FieldDef[] = [
  { key: "contact_name", label: "اسم جهة الاتصال", aliases: NAME_ALIASES, required: true },
  { key: "company_name", label: "اسم الشركة", aliases: COMPANY_ALIASES },
  { key: "phone", label: "الهاتف", aliases: PHONE_ALIASES, type: "phone" },
  { key: "whatsapp", label: "واتساب", aliases: ["whatsapp", "واتساب", "رقم الواتساب"], type: "phone" },
  { key: "email", label: "البريد الإلكتروني", aliases: EMAIL_ALIASES, type: "email" },
  { key: "source", label: "المصدر", aliases: SOURCE_ALIASES, type: "enum", enumValues: LEAD_SOURCE_MAP },
  { key: "service_interested", label: "الخدمة", aliases: SERVICE_ALIASES, type: "enum", enumValues: SERVICE_MAP },
  { key: "sector", label: "القطاع", aliases: SECTOR_ALIASES, type: "enum", enumValues: SECTOR_MAP },
  { key: "city", label: "المدينة", aliases: CITY_ALIASES },
  { key: "job_title", label: "المسمى الوظيفي", aliases: TITLE_ALIASES },
  { key: "notes", label: "ملاحظات", aliases: NOTES_ALIASES },
  { key: "first_contact_date", label: "تاريخ التواصل", aliases: DATE_ALIASES, type: "date" },
];

export const CLIENT_FIELDS: FieldDef[] = [
  { key: "company_name", label: "اسم الشركة", aliases: COMPANY_ALIASES, required: true },
  { key: "contact_person", label: "الشخص المسؤول", aliases: NAME_ALIASES },
  { key: "phone", label: "الهاتف", aliases: PHONE_ALIASES, type: "phone" },
  { key: "whatsapp", label: "واتساب", aliases: ["whatsapp", "واتساب", "رقم الواتساب"], type: "phone" },
  { key: "email", label: "البريد", aliases: EMAIL_ALIASES, type: "email" },
  { key: "sector", label: "القطاع", aliases: SECTOR_ALIASES, type: "enum", enumValues: SECTOR_MAP },
  { key: "city", label: "المدينة", aliases: CITY_ALIASES },
  { key: "address", label: "العنوان", aliases: ["address", "العنوان", "عنوان"] },
  { key: "tax_number", label: "الرقم الضريبي", aliases: ["tax", "tax number", "vat", "الرقم الضريبي", "ضريبي"] },
  { key: "notes", label: "ملاحظات", aliases: NOTES_ALIASES },
];

export function fieldsFor(m: ModuleKey): FieldDef[] {
  return m === "leads" ? LEAD_FIELDS : CLIENT_FIELDS;
}

function norm(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

export function suggestMapping(headers: string[], m: ModuleKey): Record<string, string> {
  const fields = fieldsFor(m);
  const result: Record<string, string> = {};
  const used = new Set<string>();
  for (const h of headers) {
    const n = norm(h);
    let best: string | null = null;
    for (const f of fields) {
      if (used.has(f.key)) continue;
      if (f.aliases.some((a) => n === norm(a) || n.includes(norm(a)) || norm(a).includes(n))) {
        best = f.key;
        break;
      }
    }
    if (best) {
      result[h] = best;
      used.add(best);
    } else {
      result[h] = "__ignore__";
    }
  }
  return result;
}

// Egyptian phone normalization → +20XXXXXXXXXX
export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  let s = String(raw).replace(/[^\d+]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) return s;
  // Egypt logic
  if (s.startsWith("20")) return "+" + s;
  if (s.startsWith("01") && s.length === 11) return "+2" + s;
  if (s.startsWith("1") && s.length === 10) return "+20" + s;
  return s.length >= 8 ? "+" + s : null;
}

export function isEmail(s: unknown): boolean {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function parseSheet(file: ArrayBuffer): { headers: string[]; rows: Record<string, unknown>[] } {
  const wb = XLSX.read(file, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export type RowResult = {
  index: number;
  data: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  duplicate?: boolean;
};

export function processRows(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
  m: ModuleKey,
): RowResult[] {
  const fields = fieldsFor(m);
  const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
  const results: RowResult[] = [];
  const seen = new Map<string, number>(); // key → index

  rows.forEach((raw, index) => {
    const data: Record<string, unknown> = {};
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const [sourceCol, targetKey] of Object.entries(mapping)) {
      if (targetKey === "__ignore__") continue;
      const field = byKey[targetKey];
      if (!field) continue;
      const val = raw[sourceCol];
      if (val === "" || val == null) continue;

      if (field.type === "phone") {
        const p = normalizePhone(val);
        if (!p) warnings.push(`${field.label}: رقم غير صالح (${val})`);
        else data[targetKey] = p;
      } else if (field.type === "email") {
        if (!isEmail(val)) warnings.push(`${field.label}: بريد غير صالح`);
        else data[targetKey] = String(val).trim().toLowerCase();
      } else if (field.type === "enum" && field.enumValues) {
        const n = norm(String(val));
        const match = Object.entries(field.enumValues).find(
          ([k]) => n === norm(k) || n.includes(norm(k)),
        );
        data[targetKey] = match ? match[1] : String(val);
        if (!match) warnings.push(`${field.label}: قيمة غير معروفة، تم الحفظ كما هي`);
      } else if (field.type === "date") {
        const d = new Date(String(val));
        if (isNaN(d.getTime())) warnings.push(`${field.label}: تاريخ غير صالح`);
        else data[targetKey] = d.toISOString().slice(0, 10);
      } else {
        data[targetKey] = String(val).trim();
      }
    }

    for (const f of fields) {
      if (f.required && !data[f.key]) errors.push(`${f.label} مطلوب`);
    }

    // dedup by phone/email/company inside file
    const dupKey =
      (data.phone as string | undefined) ??
      (data.email as string | undefined) ??
      (data.company_name as string | undefined) ??
      "";
    let duplicate = false;
    if (dupKey) {
      if (seen.has(dupKey)) duplicate = true;
      else seen.set(dupKey, index);
    }

    results.push({ index, data, warnings, errors, duplicate });
  });

  return results;
}
