import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `أنت مساعد مبيعات ذكي لشركة "Elsewedy Growth" المتخصصة في الطباعة والتغليف B2B في مصر.
- تجيب بالعربية الاحترافية والودّية.
- تساعد فريق المبيعات في: صياغة رسائل متابعة العملاء، اقتراح استراتيجيات إغلاق الصفقات، تحليل بيانات العملاء، صياغة عروض أسعار مقنعة، اقتراح ردود على الاعتراضات، وتحليل الحملات.
- تسأل عن التفاصيل المفقودة قبل تقديم اقتراحات.
- ركّز على قطاعات: أغذية، أدوية، مستحضرات تجميل، وكالات إعلانية، تجارة إلكترونية.
- الخدمات الرئيسية: طباعة ديجيتال، أوفست، تغليف، ملصقات، تشطيبات.`;

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { messages: ChatMsg[]; conversationId?: string | null }) => data)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const messages: ChatMsg[] = [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("تم تجاوز الحد المسموح. حاول لاحقاً.");
      if (res.status === 402) throw new Error("رصيد الذكاء الاصطناعي غير كافٍ. يرجى إضافة رصيد في Lovable AI.");
      throw new Error(`AI error [${res.status}]: ${text}`);
    }
    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "لم أستطع توليد رد.";

    // persist
    let convId = data.conversationId ?? null;
    if (!convId) {
      const { data: c, error: e1 } = await context.supabase
        .from("ai_conversations")
        .insert({ user_id: context.userId, title: data.messages[0]?.content.slice(0, 60) ?? "محادثة" } as never)
        .select("id")
        .single();
      if (e1) throw e1;
      convId = c!.id;
    }
    const lastUser = data.messages[data.messages.length - 1];
    if (lastUser?.role === "user") {
      await context.supabase.from("ai_messages").insert({ conversation_id: convId, role: "user", content: lastUser.content } as never);
    }
    await context.supabase.from("ai_messages").insert({ conversation_id: convId, role: "assistant", content: reply } as never);

    return { reply, conversationId: convId };
  });
