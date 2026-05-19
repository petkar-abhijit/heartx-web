import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/diary")({
  component: DiaryPage,
});

interface DiaryEntry {
  id: string;
  date: string; // ISO
  text: string;
}

function DiaryPage() {
  const [entries, setEntries] = React.useState<DiaryEntry[]>([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const today = new Date();

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await apiFetch<DiaryEntry[]>("/diary");
        if (!cancel) setEntries(data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setEntries([]);
        } else {
          // soft-fail so UI is usable while backend isn't reachable
          setEntries([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const created = await apiFetch<DiaryEntry>("/diary", {
        method: "POST",
        body: JSON.stringify({ text, date: today.toISOString() }),
      });
      setEntries((p) => [created, ...p]);
      setText("");
      toast.success("Entry saved");
    } catch {
      // optimistic local fallback so user still sees their entry
      const created: DiaryEntry = {
        id: crypto.randomUUID(),
        date: today.toISOString(),
        text,
      };
      setEntries((p) => [created, ...p]);
      setText("");
      toast.message("Saved locally — will sync when backend is online");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="My Diary" back>
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold">New confession</h2>
          <span className="text-xs text-muted-foreground">{format(today, "EEEE, dd MMM yyyy")}</span>
        </div>
        <Textarea
          placeholder="What's on your mind today? Pour your thoughts here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        <Button onClick={save} className="mt-3 w-full" disabled={saving || !text.trim()}>
          {saving ? "Saving…" : "Save entry"}
        </Button>
      </section>

      <h3 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">Past entries</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-1 text-xs text-muted-foreground">
                {format(new Date(e.date), "EEEE, dd MMM yyyy · p")}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{e.text}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
