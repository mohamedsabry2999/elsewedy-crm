// Central place for all Arabic labels and enum options used across the CRM.

export const LEAD_SOURCES = [
  { value: "facebook_ads", label: "إعلانات فيسبوك" },
  { value: "google_ads", label: "إعلانات جوجل" },
  { value: "website", label: "الموقع الإلكتروني" },
  { value: "whatsapp", label: "واتساب" },
  { value: "linkedin", label: "لينكدإن" },
  { value: "exhibition", label: "معرض" },
  { value: "referral", label: "توصية" },
  { value: "walk_in", label: "زيارة مباشرة" },
  { value: "cold_call", label: "اتصال بارد" },
  { value: "email_campaign", label: "حملة بريد إلكتروني" },
  { value: "seo", label: "SEO" },
] as const;

export const SERVICES = [
  { value: "digital", label: "طباعة ديجيتال" },
  { value: "offset", label: "طباعة أوفست" },
  { value: "packaging", label: "تغليف" },
  { value: "labels", label: "ملصقات وليبل" },
  { value: "finishing", label: "تشطيبات" },
  { value: "export", label: "طلبات تصدير" },
] as const;

export const SECTORS = [
  { value: "food", label: "أغذية" },
  { value: "pharma", label: "أدوية" },
  { value: "cosmetics", label: "مستحضرات تجميل" },
  { value: "fmcg", label: "سلع استهلاكية" },
  { value: "agencies", label: "وكالات إعلانية" },
  { value: "print_houses", label: "دور طباعة" },
  { value: "apparel", label: "ملابس" },
  { value: "real_estate", label: "عقارات" },
  { value: "ecommerce", label: "تجارة إلكترونية" },
  { value: "export", label: "تصدير" },
] as const;

export const TEMPERATURES = [
  { value: "hot", label: "ساخن", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { value: "warm", label: "دافئ", color: "bg-warning/10 text-warning border-warning/30" },
  { value: "cold", label: "بارد", color: "bg-info/10 text-info border-info/30" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "جديد" },
  { value: "contacted", label: "تم التواصل" },
  { value: "qualified", label: "مؤهل" },
  { value: "unqualified", label: "غير مؤهل" },
  { value: "converted", label: "تم التحويل" },
  { value: "lost", label: "خاسر" },
] as const;

export const DEAL_STAGES = [
  { value: "new_lead", label: "عميل محتمل جديد" },
  { value: "contacted", label: "تم التواصل" },
  { value: "qualified", label: "مؤهل" },
  { value: "need_analysis", label: "تحليل الاحتياج" },
  { value: "sample_review", label: "مراجعة عينة/ملف" },
  { value: "quotation_requested", label: "طلب عرض سعر" },
  { value: "quotation_sent", label: "تم إرسال العرض" },
  { value: "follow_up", label: "متابعة" },
  { value: "negotiation", label: "تفاوض" },
  { value: "won", label: "مربوح" },
  { value: "lost", label: "خاسر" },
  { value: "dormant", label: "خامل" },
  { value: "reorder", label: "إعادة طلب" },
] as const;

export const TASK_TYPES = [
  { value: "call", label: "اتصال بالعميل" },
  { value: "send_quote", label: "إرسال عرض سعر" },
  { value: "follow_quote", label: "متابعة عرض السعر" },
  { value: "request_artwork", label: "طلب ملف تصميم" },
  { value: "send_sample", label: "إرسال عينة" },
  { value: "check_pricing", label: "مراجعة التسعير" },
  { value: "follow_payment", label: "متابعة السداد" },
  { value: "after_delivery", label: "متابعة ما بعد التسليم" },
  { value: "reactivate", label: "إعادة تفعيل عميل" },
] as const;

export const TASK_STATUSES = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتملة" },
  { value: "cancelled", label: "ملغاة" },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
  { value: "urgent", label: "عاجلة" },
] as const;

export const QUOTATION_STATUSES = [
  { value: "draft", label: "مسودة" },
  { value: "waiting_pricing", label: "بانتظار التسعير" },
  { value: "sent", label: "تم الإرسال" },
  { value: "viewed", label: "شوهد بواسطة العميل" },
  { value: "follow_up", label: "بحاجة متابعة" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
  { value: "expired", label: "منتهي الصلاحية" },
] as const;

export const CLIENT_TYPES = [
  { value: "new", label: "جديد" },
  { value: "repeat", label: "متكرر" },
  { value: "vip", label: "VIP" },
  { value: "dormant", label: "خامل" },
] as const;

export const APP_ROLES = [
  { value: "super_admin", label: "مدير النظام" },
  { value: "top_management", label: "الإدارة العليا" },
  { value: "marketing_manager", label: "مدير التسويق" },
  { value: "sales_manager", label: "مدير المبيعات" },
  { value: "sales_person", label: "مندوب مبيعات" },
  { value: "pricing_team", label: "فريق التسعير" },
  { value: "production_planning", label: "تخطيط الإنتاج" },
  { value: "accounting", label: "الحسابات" },
  { value: "customer_service", label: "خدمة العملاء" },
  { value: "viewer", label: "مشاهدة فقط" },
] as const;

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}

export function formatEGP(amount: number | null | undefined) {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number | null | undefined) {
  return new Intl.NumberFormat("ar-EG").format(Number(n ?? 0));
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(date);
}
