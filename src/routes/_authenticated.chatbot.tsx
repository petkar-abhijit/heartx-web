import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chatbot")({
  component: ChatbotPage,
});

interface Msg {
  id: string;
  role: "user" | "bot";
  text: string;
}

function ChatbotPage() {
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I'm here for you. How are you feeling right now?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const u: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((p) => [...p, u]);
    setInput("");
    setSending(true);
    try {
      const resp = await apiFetch<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "bot", text: resp.reply }]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "I'm having trouble reaching the server right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="Chatbot" back>
      <div className="flex h-[calc(100vh-9rem)] flex-col rounded-2xl border bg-card shadow-sm">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-secondary px-3.5 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex gap-2 border-t p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
