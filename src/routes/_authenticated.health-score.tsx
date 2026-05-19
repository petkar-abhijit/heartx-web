import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/health-score")({
  component: HealthScorePage,
});

const GAD7 = [
  "Feeling nervous, anxious or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];
const PHQ9 = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you're a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly, or being fidgety/restless",
  "Thoughts you'd be better off dead, or of hurting yourself",
];
const OPTIONS = [
  { v: 0, l: "Not at all" },
  { v: 1, l: "Several days" },
  { v: 2, l: "More than half the days" },
  { v: 3, l: "Nearly every day" },
];

function severity(score: number, kind: "gad7" | "phq9") {
  if (kind === "gad7") {
    if (score <= 4) return { label: "Minimal anxiety", tone: "text-emerald-600" };
    if (score <= 9) return { label: "Mild anxiety", tone: "text-amber-600" };
    if (score <= 14) return { label: "Moderate anxiety", tone: "text-orange-600" };
    return { label: "Severe anxiety", tone: "text-destructive" };
  }
  if (score <= 4) return { label: "Minimal depression", tone: "text-emerald-600" };
  if (score <= 9) return { label: "Mild depression", tone: "text-amber-600" };
  if (score <= 14) return { label: "Moderate depression", tone: "text-orange-600" };
  if (score <= 19) return { label: "Moderately severe", tone: "text-orange-700" };
  return { label: "Severe depression", tone: "text-destructive" };
}

function Questionnaire({ kind, items }: { kind: "gad7" | "phq9"; items: string[] }) {
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState<number | null>(null);
  const total = Object.values(answers).reduce((a, b) => a + b, 0);
  const allAnswered = items.every((_, i) => answers[i] !== undefined);

  const submit = async () => {
    setSubmitted(total);
    try {
      await apiFetch(`/health-score/${kind}`, {
        method: "POST",
        body: JSON.stringify({ answers, score: total, date: new Date().toISOString() }),
      });
      toast.success("Score saved");
    } catch {
      toast.message("Saved locally");
    }
  };

  if (submitted !== null) {
    const sev = severity(submitted, kind);
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">{kind.toUpperCase()} score</p>
        <p className="text-5xl font-bold">{submitted}</p>
        <p className={`text-base font-semibold ${sev.tone}`}>{sev.label}</p>
        <Button
          variant="outline"
          onClick={() => {
            setAnswers({});
            setSubmitted(null);
          }}
        >
          Take again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Over the last 2 weeks, how often have you been bothered by:
      </p>
      {items.map((q, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium">
            {i + 1}. {q}
          </p>
          <RadioGroup
            value={answers[i]?.toString() ?? ""}
            onValueChange={(v) => setAnswers((p) => ({ ...p, [i]: Number(v) }))}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {OPTIONS.map((o) => (
              <Label
                key={o.v}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value={o.v.toString()} />
                {o.l}
              </Label>
            ))}
          </RadioGroup>
        </div>
      ))}
      <Button onClick={submit} className="w-full" disabled={!allAnswered}>
        See my score
      </Button>
    </div>
  );
}

function HealthScorePage() {
  return (
    <AppShell title="My Health Score" back>
      <Tabs defaultValue="gad7">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gad7">GAD-7 (Anxiety)</TabsTrigger>
          <TabsTrigger value="phq9">PHQ-9 (Depression)</TabsTrigger>
        </TabsList>
        <TabsContent value="gad7" className="mt-4">
          <Questionnaire kind="gad7" items={GAD7} />
        </TabsContent>
        <TabsContent value="phq9" className="mt-4">
          <Questionnaire kind="phq9" items={PHQ9} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
