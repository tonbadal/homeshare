"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react";
import { InviteDialog } from "@/components/invite-dialog";
import type { Tables } from "@/lib/types/database.types";

type MemberWithProfile = Tables<"home_members"> & {
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type InviteWithProfile = Tables<"invites"> & {
  profiles: { display_name: string | null };
};

interface MembersPageProps {
  members: MemberWithProfile[];
  invites: InviteWithProfile[];
  isAdmin: boolean;
  userId: string;
  homeId: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  guest: "bg-gray-100 text-gray-800",
};

function isInviteActive(invite: Tables<"invites">): boolean {
  if (!invite.is_active) return false;
  if (invite.expires_at && new Date(invite.expires_at) <= new Date()) return false;
  if (invite.max_uses !== null && invite.times_used >= invite.max_uses) return false;
  return true;
}

export function MembersPage({
  members: initialMembers,
  invites: initialInvites,
  isAdmin,
  userId,
  homeId,
}: MembersPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [showExpired, setShowExpired] = useState(false);

  const activeInvites = invites.filter(isInviteActive);
  const expiredInvites = invites.filter((i) => !isInviteActive(i));

  async function handleRefreshInvites() {
    const { data } = await supabase
      .from("invites")
      .select("*, profiles!invites_invited_by_fkey(display_name)")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false });
    if (data) {
      setInvites(data as InviteWithProfile[]);
    }
  }

  async function handleRoleChange(memberId: string, newRole: "admin" | "member") {
    const { error } = await supabase
      .from("home_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: "Failed to change role.", variant: "destructive" });
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast({ title: "Role updated!" });
    }
  }

  async function handleRemoveMember(memberId: string) {
    const { error } = await supabase
      .from("home_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast({ title: "Member removed." });
    }
  }

  async function handleDeactivateInvite(inviteId: string) {
    const { error } = await supabase
      .from("invites")
      .update({ is_active: false })
      .eq("id", inviteId);

    if (!error) {
      setInvites((prev) =>
        prev.map((i) => (i.id === inviteId ? { ...i, is_active: false } : i))
      );
      toast({ title: "Invite deactivated." });
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    const { error } = await supabase.from("invites").delete().eq("id", inviteId);
    if (!error) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({ title: "Invite deleted." });
    }
  }

  function formatUsage(invite: Tables<"invites">) {
    if (invite.max_uses === null) return `${invite.times_used} uses`;
    return `${invite.times_used} / ${invite.max_uses} uses`;
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {isAdmin && (
            <InviteDialog
              homeId={homeId}
              userId={userId}
              onInviteCreated={handleRefreshInvites}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const profile = member.profiles;
              const initials = (profile.display_name || profile.email)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile.display_name || profile.email}
                      {member.user_id === userId && (
                        <span className="text-[var(--muted-foreground)]"> (you)</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {profile.email}
                    </p>
                  </div>
                  <Badge className={roleColors[member.role]} variant="outline">
                    {member.role}
                  </Badge>
                  {isAdmin && member.role !== "owner" && member.user_id !== userId && (
                    <div className="flex items-center gap-1">
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleRoleChange(member.id, v as "admin" | "member")}
                      >
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--destructive)]"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invite Management — admin only */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Invite Links</CardTitle>
              <CardDescription>
                Manage invite links for your home. Reusable links can be shared with multiple people.
              </CardDescription>
            </div>
            <InviteDialog
              homeId={homeId}
              userId={userId}
              onInviteCreated={handleRefreshInvites}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active invites */}
            {activeInvites.length > 0 ? (
              <div className="space-y-3">
                {activeInvites.map((invite) => {
                  const inviteUrl = `${window.location.origin}/invite/${invite.code}`;
                  return (
                    <div key={invite.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs bg-[var(--muted)] px-2 py-1 rounded truncate max-w-[200px] sm:max-w-none">
                            {inviteUrl}
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            {invite.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                          <span>
                            expires{" "}
                            {invite.expires_at
                              ? new Date(invite.expires_at).toLocaleDateString()
                              : "never"}
                          </span>
                          <span>{formatUsage(invite)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        title="Copy link"
                        onClick={async () => {
                          await navigator.clipboard.writeText(inviteUrl);
                          toast({ title: "Link copied!" });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-[var(--destructive)]"
                        title="Deactivate"
                        onClick={() => handleDeactivateInvite(invite.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                No active invite links. Use the Invite button above to create one.
              </p>
            )}

            {/* Expired / used / deactivated invites */}
            {expiredInvites.length > 0 && (
              <div>
                <button
                  onClick={() => setShowExpired(!showExpired)}
                  className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showExpired ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {expiredInvites.length} expired or deactivated invite
                  {expiredInvites.length !== 1 ? "s" : ""}
                </button>
                {showExpired && (
                  <div className="mt-3 space-y-3 opacity-60">
                    {expiredInvites.map((invite) => {
                      const inviteUrl = `${window.location.origin}/invite/${invite.code}`;
                      return (
                        <div key={invite.id} className="flex items-center gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs bg-[var(--muted)] px-2 py-1 rounded truncate max-w-[200px] sm:max-w-none">
                                {inviteUrl}
                              </span>
                              <Badge variant="outline" className="shrink-0">
                                {invite.role}
                              </Badge>
                              {!invite.is_active && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  deactivated
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                              <span>
                                {invite.expires_at
                                  ? `expired ${new Date(invite.expires_at).toLocaleDateString()}`
                                  : "no expiry"}
                              </span>
                              <span>{formatUsage(invite)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-[var(--destructive)]"
                            title="Delete"
                            onClick={() => handleDeleteInvite(invite.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
