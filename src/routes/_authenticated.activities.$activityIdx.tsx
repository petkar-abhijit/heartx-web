import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { programStore, type ActivityStatus } from "@/lib/programs";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/activities/$activityIdx")({
  component: TrackActivityPage,
});

function TrackActivityPage() {
  const { activityIdx } = Route.useParams();
  const idx = Number(activityIdx);
  const nav = useNavigate();
  const [program, setProgram] = React.useState(() => programStore.get());
  const [note, setNote] = React.useState("");

  if (!program || !program.activities[idx]) {
    return (
      <AppShell title="Activity" back>
        <p className="text-sm text-muted-foreground">Activity not found.</p>
        <Button className="mt-4" onClick={() => nav({ to: "/activities" })}>
          Back to activities
        </Button>
      </AppShell>
    );
  }

  const activity = program.activities[idx];
  const today = format(new Date(), "yyyy-MM-dd");
  const doneToday = activity.completedDates.includes(today);

  const persist = async (next: typeof program) => {
    programStore.set(next);
    setProgram(next);
    try {
      await apiFetch(`/programs/${next.id}`, { method: "PUT", body: JSON.stringify(next) });
    } catch {
      /* offline fallback */
    }
  };

  const setStatus = (s: ActivityStatus) => {
    const next = { ...program };
    next.activities = [...program.activities];
    next.activities[idx] = { ...activity, status: s };
    void persist(next);
  };

  const toggleToday = () => {
    const next = { ...program };
    next.activities = [...program.activities];
    const dates = doneToday
      ? activity.completedDates.filter((d) => d !== today)
      : [...activity.completedDates, today];
    let status = activity.status;
    if (dates.length === 0) status = "Not started";
    else status = "In progress";
    next.activities[idx] = { ...activity, completedDates: dates, status };
    void persist(next);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const next = { ...program };
    next.activities = [...program.activities];
    next.activities[idx] = {
      ...activity,
      notes: [{ date: new Date().toISOString(), text: note.trim() }, ...activity.notes],
    };
    void persist(next);
    setNote("");
    toast.success("Note added");
  };

  // simple progress: completedDates length capped at 30
  const pct = Math.min(100, Math.round((activity.completedDates.length / 30) * 100));

  return (
    <AppShell title={activity.name} back>
      <section className="mb-5 rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">
          {program.emoji} {program.name} · {activity.schedule}
          {activity.time ? ` · ${activity.time}` : ""}
        </p>
        <h2 className="mt-1 text-xl font-bold">{activity.name}</h2>

        <div className="mt-4">
          <Progress value={pct} />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {activity.completedDates.length} day{activity.completedDates.length === 1 ? "" : "s"} ·{" "}
            {pct}%
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={activity.status} onValueChange={(v) => setStatus(v as ActivityStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not started">Not started</SelectItem>
                <SelectItem value="In progress">In progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={toggleToday} variant={doneToday ? "outline" : "default"} className="w-full">
              {doneToday ? "Undo today" : "Mark today done"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Add a note</h3>
        <Textarea
          placeholder="How did it go today?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <Button className="mt-3 w-full" onClick={addNote} disabled={!note.trim()}>
          Save note
        </Button>

        {activity.notes.length > 0 && (
          <ul className="mt-5 space-y-3">
            {activity.notes.map((n, i) => (
              <li key={i} className="rounded-xl border bg-background p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {format(new Date(n.date), "EEEE, dd MMM yyyy · p")}
                </p>
                <p className="whitespace-pre-wrap text-sm">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
