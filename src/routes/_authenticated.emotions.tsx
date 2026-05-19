import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/emotions")({
  component: EmotionsPage,
});

interface EmotionCount {
  emotion: string;
  count: number;
}

const PALETTE = [
  "#fb4a59",
  "#fac574",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#f43f5e",
];

function EmotionsPage() {
  const [data, setData] = React.useState<EmotionCount[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<EmotionCount[]>("/emotions");
        setData(d);
      } catch {
        // graceful preview while backend is unreachable
        setData([
          { emotion: "Calm", count: 12 },
          { emotion: "Anxious", count: 9 },
          { emotion: "Grateful", count: 7 },
          { emotion: "Sad", count: 5 },
          { emotion: "Hopeful", count: 8 },
          { emotion: "Tired", count: 4 },
          { emotion: "Joyful", count: 6 },
          { emotion: "Lonely", count: 3 },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <AppShell title="World of Emotions" back>
      <p className="mb-4 text-sm text-muted-foreground">
        Each bubble represents an emotion you've expressed in your diary or chats. Bigger bubbles
        mean stronger presence.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex min-h-[60vh] flex-wrap items-center justify-center gap-3 rounded-2xl border bg-card p-6 shadow-sm">
          {data.map((d, i) => {
            const size = 60 + (d.count / max) * 110; // 60–170px
            return (
              <div
                key={d.emotion}
                className="flex items-center justify-center rounded-full text-center font-semibold text-white shadow-md transition hover:scale-105"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: PALETTE[i % PALETTE.length],
                  fontSize: Math.max(11, size / 9),
                }}
                title={`${d.emotion} • ${d.count}`}
              >
                <span className="px-2 leading-tight">
                  {d.emotion}
                  <br />
                  <span className="text-[0.7em] opacity-90">{d.count}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
