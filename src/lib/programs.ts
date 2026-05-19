// Static catalog of HeartX programs and their activities.
export type ScheduleType = "Daily" | "Weekly" | "Monthly" | "Yearly";

export interface ProgramTemplate {
  id: string;
  name: string;
  emoji: string;
  schedules: ScheduleType[];
  activities: string[];
}

export const PROGRAMS: ProgramTemplate[] = [
  {
    id: "better-habits",
    name: "Better Habits",
    emoji: "🌱",
    schedules: ["Daily"],
    activities: ["Wake Up Routine", "Make My Bed", "Read A Book"],
  },
  {
    id: "workout",
    name: "Workout",
    emoji: "💪",
    schedules: ["Daily"],
    activities: ["Do Yoga", "Do Pranayam", "Practice Meditation", "Lift Weights", "Do Aerobics"],
  },
  {
    id: "diet",
    name: "Diet",
    emoji: "🥗",
    schedules: ["Daily"],
    activities: ["Eat Breakfast Daily", "Reduce Fat", "Eat Healthier Foods"],
  },
  {
    id: "relationships",
    name: "Relationships",
    emoji: "❤️",
    schedules: ["Daily", "Weekly"],
    activities: [
      "Call/Spend Time With Parents",
      "Spend Quality Time With Girlfriend/Boyfriend/Spouse/Children",
    ],
  },
  {
    id: "chicken-soup",
    name: "Chicken-Soup For The Soul",
    emoji: "🍲",
    schedules: ["Daily", "Weekly", "Monthly", "Yearly"],
    activities: ["Do Good Deed", "Donate", "Practice Patience"],
  },
];

export type ActivityStatus = "Not started" | "In progress" | "Completed";

export interface ActivityNote {
  date: string; // ISO date
  text: string;
}

export interface ActivityState {
  name: string;
  schedule: ScheduleType;
  time?: string; // HH:MM
  status: ActivityStatus;
  completedDates: string[]; // YYYY-MM-DD
  notes: ActivityNote[];
}

export interface ActiveProgram {
  id: string; // program template id
  name: string;
  emoji: string;
  startedAt: string; // ISO
  status: "in_progress" | "completed" | "abandoned";
  activities: ActivityState[];
}

const KEY = "heartx.program";

export const programStore = {
  get(): ActiveProgram | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ActiveProgram) : null;
    } catch {
      return null;
    }
  },
  set(p: ActiveProgram | null) {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  },
};
