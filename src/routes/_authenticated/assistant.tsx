import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Plus, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/crm/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAssistant } from "@/lib/ai-chat.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "اكتب رسالة متابعة واتساب لعميل لم يرد على عرض السعر منذ 5 أيام",
  "اقترح ردوداً على اعتراض 'السعر مرتفع جداً' لعميل تغليف أدوية",
  "أعطني 5 أفكار حملات لاستهداف قطاع المستحضرات في القاهرة",
  "صيغ لي بريد إلكتروني احترافي لإعادة تفعيل عميل خامل منذ 6 شهور",
];

function AssistantPage() {
  const qc = useQueryClient();
  const call = useServerFn(chatWithAssistant);
  const [convId, setConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: async () => (await supabase.from("ai_conversations").select("id, title, created_at").order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    setConvId(id);
    const { data } = await supabase.from("ai_messages").select("role, content").eq("conversation_id", id).order("created_at");
    setMessages((data ?? []).filter((m) => m.role !== "system") as Msg[]);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await call({ data: { messages: next, conversationId: convId } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      setConvId(res.conversationId);
      qc.invalidateQueries({ queryKey: ["ai-conversations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ في المساعد");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => { setConvId(null); setMessages([]); };

  return (
    <div>
      <PageHeader
        title="المساعد الذكي"
        description="ذكاء اصطناعي مدرّب على سياق شركة الطباعة B2B — يساعدك في المتابعات والعروض والحملات."
        actions={<Button variant="outline" onClick={newChat} className="gap-2"><Plus className="h-4 w-4" /> محادثة جديدة</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 h-[calc(100vh-14rem)]">
        <Card className="shadow-card p-3 overflow-y-auto hidden lg:block">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">المحادثات السابقة</p>
          <div className="space-y-1">
            {(conversations ?? []).length === 0 && <p className="text-xs text-muted-foreground p-2">لا يوجد سجل بعد</p>}
            {(conversations ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={cn(
                  "w-full text-right text-xs rounded-md px-2 py-2 hover:bg-muted transition-colors truncate",
                  convId === c.id && "bg-muted font-medium",
                )}
              >
                {c.title}
              </button>
            ))}
          </div>
        </Card>

        <Card className="shadow-card flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-elegant mb-4">
                  <Bot className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">كيف يمكنني مساعدتك اليوم؟</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">اسألني عن أي شيء يخص العملاء، العروض، أو الحملات.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-right text-xs p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                      <Sparkles className="h-3.5 w-3.5 inline ml-2 text-primary" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Bot className="h-4 w-4" /></div>
                <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)"
                rows={2}
                className="resize-none"
                disabled={loading}
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
