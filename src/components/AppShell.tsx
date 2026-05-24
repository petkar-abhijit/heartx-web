import * as React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";

interface Props {
  children: React.ReactNode;
  title?: string;
  back?: boolean;
}

export function AppShell({ children, title, back }: Props) {
  const { logout, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const isDash = loc.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            {back && !isDash && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back"
                onClick={() => nav({ to: "/dashboard" })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="HeartX logo" className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight">
                Heart<span className="text-primary">X</span>
              </span>
            </Link>
          </div>
          {title && <h1 className="hidden text-sm font-medium text-muted-foreground sm:block">{title}</h1>}
          {user && (
            // <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
            //   <LogOut className="h-5 w-5" />
            // </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Logout"
              title="Logout"
              onClick={() => {
                logout();

                nav({
                  to: "/login",
                });
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
        {title && (
          <div className="mx-auto max-w-3xl px-4 pb-3 sm:hidden">
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
