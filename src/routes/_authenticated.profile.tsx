import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth, User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch, tokenStore } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [loginId, setLoginId] = React.useState(user?.loginId ?? "");
  // const [firstName, setFirstName] = React.useState(user?.firstName ?? "");
  // const [lastName, setLastName] = React.useState(user?.lastName ?? "");
  // const [gender, setGender] = React.useState(user?.gender ?? "");
  const [saving, setSaving] = React.useState(false);

  const [profile, setProfile] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (!user?.loginId) return;

    (async () => {
      try {
        const res = await apiFetch<User>("/profile", {
          method: "POST",
          body: JSON.stringify({
            loginId: user.loginId,
            token: tokenStore.get(),
          }),
        });

        console.log("Fetch profile Response...firstName  = " + res.userProfile.firstName);
        console.log("Fetch profile Response...lastName = " + res.userProfile.lastName);
        console.log("Fetch profile Response...gender = " + res.userProfile.gender);

        setProfile({
          ...res.userProfile,
          loginId: user.loginId,
        });
      } catch {
        toast.error("Could not load profile");
      }
    })();
  }, [user?.loginId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tokenValue = tokenStore.get();

      await updateProfile({
        loginId,
        token: tokenValue,
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        gender: profile?.gender ?? "",
      });

      toast.success("Profile updated");
    } catch (err) {
      console.error("SAVE FAILED:", err);
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Profile" back>
      <form
        onSubmit={save}
        className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm"
      >
        {/* Login ID */}
        <div className="space-y-2">
          <Label>Login ID</Label>
          <Input value={user?.loginId ?? ""} disabled />
        </div>

        {/* First + Last name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fn">First name</Label>
            <Input
              id="fn"
              value={profile?.firstName ?? ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...(prev ?? ({} as User)),
                  firstName: e.target.value,
                }))
              }
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ln">Last name</Label>
            <Input
              id="ln"
              value={profile?.lastName ?? ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...(prev ?? ({} as User)),
                  lastName: e.target.value,
                }))
              }
              placeholder="Enter last name"
            />
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>Gender</Label>

          <Select
            value={profile?.gender ?? ""}
            onValueChange={(value) =>
              setProfile((prev) => ({
                ...(prev ?? ({} as User)),
                gender: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="prefer-not">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save button */}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      {/* Logout */}
    </AppShell>
  );
}
