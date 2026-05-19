import * as React from "react";
import { apiFetch, tokenStore } from "./api";

export interface User {
  loginId: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  loginWithGoogleCode: (code: string, redirectUri: string) => Promise<void>;
  startGoogleLogin: () => void;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  logout: () => void;
}

const Ctx = React.createContext<AuthState | null>(null);

const USER_KEY = "heartx.user";

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() =>
    typeof window === "undefined" ? null : readStoredUser(),
  );
  const [loading, setLoading] = React.useState(false);
  

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  const requestOtp = async (email: string) => {
    setLoading(true);
    try {
      await apiFetch("/authenticate", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ 'loginId' : email }),
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);

    try {
      const resp = await apiFetch<{ token: string; user: Partial<User> }>(
        "/validateotp",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({
            loginId: email,
            otp,
          }),
        },
      );

      tokenStore.set(resp.token);

      const user: User = {
        ...resp.user,
        loginId: email,
      };

      persist(user);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleCode = async (code: string, redirectUri: string) => {
    setLoading(true);
    try {
      const resp = await apiFetch<{ token: string; user: User }>("/auth/google", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ code, redirectUri }),
      });
      tokenStore.set(resp.token);
      persist({ ...(user ?? { loginId: "" }), ...resp });
    } finally {
      setLoading(false);
    }
  };

  const startGoogleLogin = () => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";
    if (!clientId) {
      throw new Error(
        "Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID to your Google OAuth Web Client ID.",
      );
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const state = crypto.randomUUID();
    sessionStorage.setItem("heartx.google.state", state);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const updateProfile = async (patch: Partial<User>) => {
    const resp = await apiFetch<User>("/saveprofile", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        ...patch,
        loginId: user?.loginId,
        token: tokenStore.get(),
      }),
    });

    persist({
      loginId: user?.loginId ?? "",
      ...resp,
    });
  };

  const logout = () => {
    tokenStore.clear();
    persist(null);
  };

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    loading,
    requestOtp,
    verifyOtp,
    loginWithGoogleCode,
    startGoogleLogin,
    updateProfile,
    logout,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
