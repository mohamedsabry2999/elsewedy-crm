import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/crm-constants";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const KIND_COLOR: Record<string, string> = {
  external_request: "bg-primary/10 text-primary",
  lead_assigned: "bg-info/10 text-info",
  quotation: "bg-warning/10 text-warning",
  complaint: "bg-destructive/10 text-destructive",
  order: "bg-success/10 text-success",
  default: "bg-muted text-foreground",
};

export function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
  });

  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = items.filter((n) => !n.read_at).map((n) => n.id);
      if (ids.length === 0) return;
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 left-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-0" dir="rtl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="text-sm font-semibold">الإشعارات</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} غير مقروء` : "لا يوجد جديد"}
            </p>
          </div>
          {unread > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-8 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" /> تعليم الكل كمقروء
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
              لا توجد إشعارات بعد
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const color = KIND_COLOR[n.kind] ?? KIND_COLOR.default;
                const body = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      !n.read_at && "bg-primary/5",
                    )}
                    onClick={() => {
                      if (!n.read_at) void markOne(n.id);
                      setOpen(false);
                    }}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full shrink-0 flex items-center justify-center",
                        color,
                      )}
                    >
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(n.created_at)}
                      </p>
                    </div>
                    {!n.read_at && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? <Link to={n.link}>{body}</Link> : body}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
