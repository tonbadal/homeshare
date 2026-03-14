"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home, UserPlus } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();

  const [invite, setInvite] = useState<{
    home_name: string;
    role: string;
    invited_by_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Signup state
  const [mode, setMode] = useState<"check" | "signup" | "join">("check");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    async function checkInvite() {
      // Validate invite code via SECURITY DEFINER function (bypasses RLS)
      const { data: inviteData, error: inviteError } = await supabase.rpc(
        "get_invite_details",
        { p_code: code }
      );

      if (inviteError || !inviteData || inviteData.length === 0) {
        setError("This invite link is invalid or has already been used.");
        setLoading(false);
        return;
      }

      const detail = inviteData[0];
      setInvite({
        home_name: detail.home_name,
        role: detail.role,
        invited_by_name: detail.invited_by_name,
      });

      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setMode("join");
      } else {
        setMode("signup");
      }
      setLoading(false);
    }

    checkInvite();
  }, [code, supabase]);

  async function handleSignupAndJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setError("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setJoining(false);
      return;
    }

    if (data.user) {
      await redeemInvite();
    }
  }

  async function handleJoin() {
    if (!user) return;
    setJoining(true);
    setError("");
    await redeemInvite();
  }

  async function redeemInvite() {
    const { data: homeId, error: redeemError } = await supabase.rpc(
      "redeem_invite",
      { p_code: code }
    );

    if (redeemError) {
      setError(redeemError.message ?? "Failed to join the home. Please try again.");
      setJoining(false);
      return;
    }

    router.push(`/home/${homeId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </CardContent>
      </Card>
    );
  }

  if (error && !invite) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Invalid Invite</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline">Go to login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] mx-auto mb-2">
          <Home className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">You&apos;re invited!</CardTitle>
        <CardDescription>
          {invite?.invited_by_name} invited you to join <strong>{invite?.home_name}</strong> as a{" "}
          <span className="capitalize">{invite?.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "signup" ? (
          <form onSubmit={handleSignupAndJoin} className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
              Create an account to join this home.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
            <Button type="submit" className="w-full" disabled={joining}>
              {joining ? <Loader2 className="animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Sign up & join
            </Button>
            <p className="text-sm text-center text-[var(--muted-foreground)]">
              Already have an account?{" "}
              <Link href={`/login?redirect=/invite/${code}`} className="text-[var(--primary)] hover:underline">
                Log in
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
            <Button onClick={handleJoin} className="w-full" disabled={joining}>
              {joining ? <Loader2 className="animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Join {invite?.home_name}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
