"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface UserSettingsProps {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  homeId: string;
  userEmail: string;
}

export function UserSettings({ profile, homeId, userEmail }: UserSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Profile form state
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Email form state
  const [newEmail, setNewEmail] = useState(userEmail);
  const [savingEmail, setSavingEmail] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast({ title: "Name is required", variant: "destructive" });
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      router.refresh();
    }

    setSavingProfile(false);
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);

    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      toast({ title: "Email is required", variant: "destructive" });
      setSavingEmail(false);
      return;
    }

    if (trimmedEmail === userEmail.toLowerCase()) {
      toast({ title: "That's already your email", variant: "destructive" });
      setSavingEmail(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: trimmedEmail });

    if (error) {
      toast({ title: "Failed to update email", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Confirmation email sent",
        description: "Check both your old and new email inboxes to confirm the change.",
      });
    }

    setSavingEmail(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);

    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      setSavingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setSavingPassword(false);
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name is visible to other members of your homes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Changing your email requires confirmation from both your current and new address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" disabled={savingEmail}>
              {savingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Set a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
