import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PROGRAMS,
  programStore,
  type ActiveProgram,
  type ScheduleType,
} from "@/lib/programs";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/activities")({
  component: ActivitiesPage,
});

function progressOf(p: ActiveProgram): number {
  if (!p.activities.length) return 0;
  const done = p.activities.filter((a) => a.status === "Completed").length;
  return Math.round((done / p.activities.length) * 100);
}

function ActivitiesPage() {
  const [program, setProgram] = React.useState<ActiveProgram | null>(() => programStore.get());
  const [open, setOpen] = React.useState(false);
  const nav = useNavigate();

  const finalize = async (status: "completed" | "abandoned") => {
    if (!program) return;
    const updated = { ...program, status };
    try {
      await apiFetch(`/programs/${program.id}/${status}`, { method: "POST" });
    } catch {
      // local-only fallback
    }
    programStore.set(null);
    setProgram(null);
    toast.success(status === "completed" ? "Program marked complete 🎉" : "Program abandoned");
    void updated;
  };

  return (
    <AppShell title="My Activities" back>
      {program && program.status === "in_progress" ? (
        <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Active program</p>
              <h2 className="text-xl font-bold">
                {program.emoji} {program.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Started {format(new Date(program.startedAt), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <Progress value={progressOf(program)} className="mb-1" />
          <p className="mb-4 text-right text-xs text-muted-foreground">
            {progressOf(program)}% complete
          </p>

          <ul className="space-y-2">
            {program.activities.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.schedule}
                    {a.time ? ` · ${a.time}` : ""} · {a.status}
                  </p>
                </div>
                <Link
                  to="/activities/$activityIdx"
                  params={{ activityIdx: String(i) }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Track →
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => finalize("abandoned")}>
              Abandon
            </Button>
            <Button onClick={() => finalize("completed")}>Mark complete</Button>
          </div>
        </section>
      ) : (
        <section className="mb-6 rounded-2xl border border-dashed bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No active program yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can run one program at a time. Pick one below to begin.
          </p>
        </section>
      )}

      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Programs</h3>
      <ul className="space-y-3">
        {PROGRAMS.map((p) => (
          <li key={p.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold">
                  {p.emoji} {p.name}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.activities.length} activities · {p.schedules.join(", ")}
                </p>
              </div>
              <Dialog open={open && (program?.id ?? "") === p.id} onOpenChange={(o) => setOpen(o)}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!!program && program.status === "in_progress"}
                    onClick={() => setOpen(true)}
                  >
                    Configure
                  </Button>
                </DialogTrigger>
                <ConfigureDialog
                  template={p}
                  onStart={(np) => {
                    programStore.set(np);
                    setProgram(np);
                    setOpen(false);
                    toast.success("Program started! Stay consistent 💛");
                    void nav({ to: "/activities" });
                  }}
                />
              </Dialog>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {p.activities.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

function ConfigureDialog({
  template,
  onStart,
}: {
  template: (typeof PROGRAMS)[number];
  onStart: (p: ActiveProgram) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>(
    Object.fromEntries(template.activities.map((a) => [a, true])),
  );
  const [schedule, setSchedule] = React.useState<ScheduleType>(template.schedules[0]);
  const [time, setTime] = React.useState("08:00");

  const start = async () => {
    const chosen = template.activities.filter((a) => selected[a]);
    if (chosen.length === 0) {
      toast.error("Pick at least one activity");
      return;
    }
    const program: ActiveProgram = {
      id: template.id,
      name: template.name,
      emoji: template.emoji,
      startedAt: new Date().toISOString(),
      status: "in_progress",
      activities: chosen.map((name) => ({
        name,
        schedule,
        time: schedule === "Daily" ? time : undefined,
        status: "Not started",
        completedDates: [],
        notes: [],
      })),
    };
    try {
      await apiFetch("/programs", { method: "POST", body: JSON.stringify(program) });
    } catch {
      /* offline fallback */
    }
    onStart(program);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {template.emoji} Configure {template.name}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Once started, activities cannot be modified.
        </p>
        <div className="space-y-2">
          <Label>Activities</Label>
          {template.activities.map((a) => (
            <Label key={a} className="flex items-start gap-3 rounded-md border p-2 text-sm">
              <Checkbox
                checked={selected[a]}
                onCheckedChange={(v) => setSelected((p) => ({ ...p, [a]: !!v }))}
              />
              <span>{a}</span>
            </Label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Schedule</Label>
            <Select value={schedule} onValueChange={(v) => setSchedule(v as ScheduleType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {template.schedules.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {schedule === "Daily" && (
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={start} className="w-full">
          Start program
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
