import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";


export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("heartx.user")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { requestOtp, verifyOtp, startGoogleLogin, loading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [stage, setStage] = React.useState<"email" | "otp">("email");

  const navigate = useNavigate();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    try {
      await requestOtp(email);
      toast.success("OTP sent — check your email");
      setStage("otp");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not send OTP";
      toast.error(msg);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    try {
      await verifyOtp(email, otp);
      toast.success("Welcome back");

      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid OTP";
      toast.error(msg);
    }
  };

  React.useEffect(() => {
    if (stage === "otp" && otp.length === 6) void handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, stage]);

  const handleGoogle = () => {
    try {
      startGoogleLogin();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in is not configured";
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-secondary via-background to-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="HeartX" className="h-16 w-16" />
          <h1 className="mt-3 text-2xl font-bold">
            Heart<span className="text-primary">X</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your companion for mental wellness</p>
        </div>

        {stage === "email" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send 6-digit code"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerify} className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying…" : "Verify & continue"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setOtp("");
              }}
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
          <GoogleIcon /> Continue with Google
        </Button>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By continuing you agree to HeartX's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.89-1.742 2.982-4.305 2.982-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H3.064v2.59A9.997 9.997 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.9A6.005 6.005 0 0 1 6.09 12c0-.66.114-1.3.314-1.9V7.51H3.064A9.998 9.998 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.785.504 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2A9.997 9.997 0 0 0 3.064 7.51l3.34 2.59C7.19 7.737 9.395 5.977 12 5.977Z"
      />
    </svg>
  );
}
