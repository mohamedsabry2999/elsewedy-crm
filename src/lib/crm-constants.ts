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

// ============ Phase 2/3 ============
export const ORDER_STATUSES = [
  { value: "new", label: "جديد" },
  { value: "in_production", label: "قيد الإنتاج" },
  { value: "quality_check", label: "فحص الجودة" },
  { value: "packaging", label: "التغليف" },
  { value: "ready", label: "جاهز للتسليم" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "on_hold", label: "معلق" },
  { value: "cancelled", label: "ملغى" },
] as const;

export const PRODUCTION_STAGE_TEMPLATE = [
  "استلام الملف",
  "التصميم الفني",
  "الموافقة على الماكيت",
  "التسعير النهائي",
  "شراء الخامات",
  "الطباعة",
  "التشطيبات",
  "فحص الجودة",
  "التغليف",
  "الشحن",
] as const;

export const PRODUCTION_STAGE_STATUSES = [
  { value: "pending", label: "بانتظار البدء" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "done", label: "مكتملة" },
  { value: "blocked", label: "متوقفة" },
  { value: "skipped", label: "تم التخطي" },
] as const;

export const COMPLAINT_TYPES = [
  { value: "delay", label: "تأخير في التسليم" },
  { value: "color_mismatch", label: "اختلاف ألوان" },
  { value: "material", label: "مشكلة في الخامة" },
  { value: "finishing", label: "تشطيبات غير مطابقة" },
  { value: "quantity_shortage", label: "نقص في الكمية" },
  { value: "damage", label: "تلف / كسر" },
  { value: "other", label: "أخرى" },
] as const;

export const COMPLAINT_STATUSES = [
  { value: "open", label: "مفتوحة" },
  { value: "investigating", label: "تحت البحث" },
  { value: "resolved", label: "تم الحل" },
  { value: "escalated", label: "مصعّدة" },
  { value: "closed", label: "مغلقة" },
] as const;

export const COMPLAINT_SEVERITIES = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
  { value: "critical", label: "حرجة" },
] as const;

export const CAMPAIGN_PLATFORMS = [
  { value: "meta", label: "Meta (فيسبوك/إنستجرام)" },
  { value: "google", label: "Google Ads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "بريد إلكتروني" },
  { value: "whatsapp", label: "واتساب" },
  { value: "seo", label: "SEO" },
  { value: "exhibition", label: "معارض" },
  { value: "other", label: "أخرى" },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: "planned", label: "مخططة" },
  { value: "active", label: "نشطة" },
  { value: "paused", label: "متوقفة" },
  { value: "completed", label: "مكتملة" },
  { value: "cancelled", label: "ملغاة" },
] as const;

export const AUTOMATION_TRIGGERS = [
  { value: "lead_created", label: "عند إنشاء عميل محتمل" },
  { value: "quotation_sent", label: "بعد إرسال عرض السعر" },
  { value: "no_followup_3d", label: "عدم متابعة لمدة 3 أيام" },
  { value: "no_followup_7d", label: "عدم متابعة لمدة 7 أيام" },
  { value: "deal_won", label: "عند ربح صفقة" },
  { value: "order_delayed", label: "عند تأخر الطلب" },
  { value: "complaint_open_48h", label: "شكوى مفتوحة > 48 ساعة" },
] as const;

export const AUTOMATION_ACTIONS = [
  { value: "create_task", label: "إنشاء مهمة" },
  { value: "notify_manager", label: "إشعار المدير" },
  { value: "change_stage", label: "تغيير مرحلة الصفقة" },
  { value: "send_whatsapp", label: "إرسال رسالة واتساب" },
  { value: "send_email", label: "إرسال بريد إلكتروني" },
] as const;

// ============ Commercial & Operations OS ============
export const PRICING_REQUEST_STATUSES = [
  { value: "draft", label: "مسودة" },
  { value: "submitted", label: "مُرسل للتسعير" },
  { value: "in_review", label: "قيد المراجعة" },
  { value: "priced", label: "تم التسعير" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
] as const;

export const URGENCY_LEVELS = [
  { value: "low", label: "منخفضة" },
  { value: "normal", label: "عادية" },
  { value: "high", label: "عاجل" },
  { value: "critical", label: "طارئ" },
] as const;

export const DELIVERY_METHODS = [
  { value: "own_fleet", label: "أسطول الشركة" },
  { value: "courier", label: "شركة شحن" },
  { value: "pickup", label: "استلام من المصنع" },
  { value: "client_transport", label: "نقل العميل" },
] as const;

export const DELIVERY_STATUSES = [
  { value: "pending", label: "بانتظار الجدولة" },
  { value: "scheduled", label: "مُجدولة" },
  { value: "in_transit", label: "في الطريق" },
  { value: "delivered", label: "تم التسليم" },
  { value: "failed", label: "فشل التسليم" },
  { value: "returned", label: "مرتجع" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "نقدي" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "check", label: "شيك" },
  { value: "credit", label: "آجل" },
  { value: "online", label: "دفع إلكتروني" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "unpaid", label: "غير مدفوع" },
  { value: "partial", label: "دفع جزئي" },
  { value: "paid", label: "مدفوع بالكامل" },
  { value: "overdue", label: "متأخر" },
  { value: "cancelled", label: "ملغى" },
] as const;

export const SAMPLE_STATUSES = [
  { value: "requested", label: "مطلوبة" },
  { value: "in_production", label: "قيد الإنتاج" },
  { value: "ready", label: "جاهزة" },
  { value: "delivered", label: "تم التسليم" },
  { value: "approved", label: "معتمدة من العميل" },
  { value: "rejected", label: "مرفوضة" },
] as const;

export const APPROVAL_TYPES = [
  { value: "discount", label: "خصم استثنائي" },
  { value: "credit_limit", label: "زيادة حد ائتماني" },
  { value: "rush_order", label: "طلب عاجل" },
  { value: "price_override", label: "تجاوز سعر" },
  { value: "refund", label: "استرداد" },
  { value: "other", label: "أخرى" },
] as const;

export const APPROVAL_STATUSES = [
  { value: "pending", label: "بانتظار الاعتماد" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
  { value: "cancelled", label: "ملغى" },
] as const;

export const MEETING_TYPES = [
  { value: "first_visit", label: "زيارة أولى" },
  { value: "followup", label: "متابعة" },
  { value: "presentation", label: "عرض تقديمي" },
  { value: "negotiation", label: "تفاوض" },
  { value: "closing", label: "إغلاق صفقة" },
  { value: "aftersales", label: "خدمة ما بعد البيع" },
] as const;

export const KNOWLEDGE_CATEGORIES = [
  { value: "products", label: "المنتجات والخدمات" },
  { value: "pricing", label: "التسعير" },
  { value: "objections", label: "الردود على الاعتراضات" },
  { value: "process", label: "الإجراءات" },
  { value: "technical", label: "المواصفات الفنية" },
  { value: "policies", label: "السياسات" },
] as const;


// Probability weights per deal stage — used for weighted pipeline / forecast.
export const DEAL_STAGE_PROBABILITY: Record<string, number> = {
  new_lead: 0.05,
  contacted: 0.1,
  qualified: 0.2,
  need_analysis: 0.3,
  sample_review: 0.4,
  quotation_requested: 0.45,
  quotation_sent: 0.55,
  follow_up: 0.6,
  negotiation: 0.75,
  won: 1,
  lost: 0,
  dormant: 0,
  reorder: 0.7,
};

// Order statuses that indicate the order is actively inside the production pipeline.
export const IN_PRODUCTION_ORDER_STATUSES = [
  "in_production",
  "quality_check",
  "packaging",
] as const;

// Order statuses that are still open (not delivered / cancelled).
export const OPEN_ORDER_STATUSES = [
  "new",
  "in_production",
  "quality_check",
  "packaging",
  "ready",
  "shipped",
  "on_hold",
] as const;
