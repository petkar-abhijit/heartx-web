import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  MessageCircleHeart,
  BookHeart,
  HeartPulse,
  Sparkles,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const tiles = [
  { to: "/activities", label: "My Activities", icon: Activity, color: "from-rose-400 to-rose-600" },
  { to: "/chatbot", label: "Chatbot", icon: MessageCircleHeart, color: "from-amber-400 to-orange-500" },
  { to: "/diary", label: "My Diary", icon: BookHeart, color: "from-pink-400 to-rose-500" },
  { to: "/health-score", label: "My Health Score", icon: HeartPulse, color: "from-teal-400 to-cyan-500" },
  { to: "/emotions", label: "World of Emotions", icon: Sparkles, color: "from-violet-400 to-fuchsia-500" },
  { to: "/profile", label: "Profile", icon: UserRound, color: "from-stone-400 to-stone-600" },
] as const;

function Dashboard() {
  const { user } = useAuth();
  //alert("LoginId = " + user?.loginId);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  return (
    <AppShell>
      <section className="mb-6">
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h2 className="text-2xl font-bold tracking-tight">
          {user?.firstName ? user?.firstName : user?.loginId?.split("@")[0]} 💛
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How are you feeling today? Take a moment for yourself.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(({ to, label, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-20 transition group-hover:opacity-30`}
            />
            <Icon className="h-7 w-7 text-primary" />
            <div className="text-sm font-semibold leading-tight">{label}</div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
