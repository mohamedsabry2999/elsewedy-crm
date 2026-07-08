// Print-based PDF export for quotations — opens a print-friendly Arabic RTL window.
// Uses the browser's built-in "Save as PDF" from the print dialog.

import { formatEGP, formatDate, labelOf, SERVICES, QUOTATION_STATUSES } from "./crm-constants";

type QuoteItem = {
  description: string;
  unit?: string | null;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  total: number;
};

type Quote = {
  id: string;
  quote_number?: string | null;
  service_type?: string | null;
  printing_type?: string | null;
  quantity?: number | null;
  size?: string | null;
  material?: string | null;
  colors?: string | null;
  unit_price?: number | null;
  total_price?: number | null;
  vat_amount?: number | null;
  discount?: number | null;
  final_price?: number | null;
  delivery_date?: string | null;
  technical_notes?: string | null;
  payment_terms?: string | null;
  validity_days?: number | null;
  status?: string | null;
  created_at?: string | null;
  items?: QuoteItem[];
  clients?: { company_name?: string | null; contact_person?: string | null; phone?: string | null; email?: string | null } | null;
};


export function printQuotationPDF(q: Quote) {
  const subtotal = Number(q.total_price ?? 0);
  const vat = q.vat_amount != null ? Number(q.vat_amount) : subtotal * 0.14;
  const discount = Number(q.discount ?? 0);
  const final = q.final_price != null ? Number(q.final_price) : subtotal + vat - discount;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>عرض سعر ${q.quote_number ?? ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', system-ui, sans-serif; margin: 0; padding: 32px; color: #1a1a1a; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d9342b; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { color: #d9342b; }
  .brand h1 { margin: 0; font-size: 26px; font-weight: 900; }
  .brand p { margin: 4px 0 0; font-size: 13px; color: #666; }
  .meta { text-align: left; font-size: 13px; }
  .meta div { margin-bottom: 4px; }
  .badge { display: inline-block; background: #d9342b; color: #fff; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  h2 { color: #d9342b; font-size: 16px; margin: 20px 0 8px; border-right: 4px solid #d9342b; padding-right: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 14px; margin-bottom: 16px; }
  .grid div span { color: #666; margin-left: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
  th { background: #f7f7f7; font-weight: 700; }
  .totals { margin-top: 16px; margin-right: auto; margin-left: 0; width: 300px; font-size: 14px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ddd; }
  .totals .final { font-weight: 900; font-size: 18px; color: #d9342b; border-bottom: none; border-top: 2px solid #d9342b; margin-top: 4px; padding-top: 8px; }
  .terms { margin-top: 32px; font-size: 12px; color: #555; line-height: 1.8; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #777; text-align: center; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
  .actions { position: fixed; top: 12px; left: 12px; }
  .actions button { background: #d9342b; color: #fff; border: 0; padding: 10px 18px; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
  <div class="actions no-print"><button onclick="window.print()">طباعة / حفظ PDF</button></div>

  <div class="header">
    <div class="brand">
      <h1>دار مدحت السويدي للطباعة والتغليف</h1>
      <p>Medhat Elsewedy Print House — Cairo, Egypt</p>
    </div>
    <div class="meta">
      <div><span class="badge">عرض سعر</span></div>
      <div><strong>رقم:</strong> ${q.quote_number ?? q.id.slice(0, 8)}</div>
      <div><strong>التاريخ:</strong> ${formatDate(q.created_at ?? new Date().toISOString())}</div>
      <div><strong>الحالة:</strong> ${labelOf(QUOTATION_STATUSES, q.status)}</div>
    </div>
  </div>

  <h2>بيانات العميل</h2>
  <div class="grid">
    <div><span>الشركة:</span><strong>${q.clients?.company_name ?? "—"}</strong></div>
    <div><span>المسؤول:</span><strong>${q.clients?.contact_person ?? "—"}</strong></div>
    <div><span>الهاتف:</span><strong>${q.clients?.phone ?? "—"}</strong></div>
    <div><span>البريد:</span><strong>${q.clients?.email ?? "—"}</strong></div>
  </div>

  <h2>تفاصيل العرض</h2>
  <table>
    <thead>
      <tr>
        <th>البند</th><th>الخدمة</th><th>المقاس</th><th>الخامة</th><th>الألوان</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>${labelOf(SERVICES, q.service_type)} ${q.printing_type ? `(${q.printing_type === "digital" ? "ديجيتال" : "أوفست"})` : ""}</td>
        <td>${q.size ?? "—"}</td>
        <td>${q.material ?? "—"}</td>
        <td>${q.colors ?? "—"}</td>
        <td>${q.quantity ?? "—"}</td>
        <td>${formatEGP(q.unit_price)}</td>
        <td>${formatEGP(subtotal)}</td>
      </tr>
    </tbody>
  </table>

  ${q.technical_notes ? `<h2>ملاحظات فنية</h2><p style="font-size:13px;line-height:1.8;">${q.technical_notes}</p>` : ""}

  <div class="totals">
    <div><span>المجموع الفرعي</span><strong>${formatEGP(subtotal)}</strong></div>
    <div><span>ضريبة القيمة المضافة (14%)</span><strong>${formatEGP(vat)}</strong></div>
    ${discount ? `<div><span>الخصم</span><strong>- ${formatEGP(discount)}</strong></div>` : ""}
    <div class="final"><span>الإجمالي النهائي</span><strong>${formatEGP(final)}</strong></div>
  </div>

  <h2>الشروط والأحكام</h2>
  <div class="terms">
    <div>• تاريخ التسليم المتوقع: <strong>${formatDate(q.delivery_date)}</strong></div>
    <div>• شروط الدفع: ${q.payment_terms ?? "50% مقدم عند التعاقد و50% عند التسليم"}</div>
    <div>• صلاحية العرض: ${q.validity_days ?? 15} يومًا من تاريخ الإصدار.</div>
    <div>• الأسعار لا تشمل مصاريف الشحن خارج القاهرة الكبرى ما لم يُذكر خلاف ذلك.</div>
    <div>• أي تعديل على المواصفات يتطلب مراجعة العرض وإعادة التسعير.</div>
  </div>

  <div class="footer">
    شكرًا لثقتكم بدار مدحت السويدي للطباعة والتغليف · تم إصدار هذا العرض إلكترونيًا عبر Elsewedy Growth CRM
  </div>

  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
