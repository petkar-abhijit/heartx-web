import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/google/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const { code, state, error } = Route.useSearch();
  const { loginWithGoogleCode } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = React.useState("Finishing Google sign-in…");
  const ranRef = React.useRef(false);

  React.useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      if (error) {
        setMessage(`Google returned an error: ${error}`);
        toast.error(`Google sign-in cancelled: ${error}`);
        setTimeout(() => navigate({ to: "/login" }), 1500);
        return;
      }
      const expected = sessionStorage.getItem("heartx.google.state");
      sessionStorage.removeItem("heartx.google.state");
      if (!code || !state || state !== expected) {
        setMessage("Invalid sign-in response. Please try again.");
        toast.error("Google sign-in failed: invalid state");
        setTimeout(() => navigate({ to: "/login" }), 1500);
        return;
      }
      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        await loginWithGoogleCode(code, redirectUri);
        toast.success("Signed in with Google");
        navigate({ to: "/dashboard" });
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Google sign-in failed";
        setMessage(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/login" }), 1800);
      }
    };
    void run();
  }, [code, state, error, loginWithGoogleCode, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-secondary via-background to-background px-4">
      <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
