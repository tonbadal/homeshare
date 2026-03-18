"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { InviteDialog } from "@/components/invite-dialog";
import { Plus, X } from "lucide-react";

type RawMember = {
  id: string;
  home_id: string;
  user_id: string;
  role: string;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type HomeInfo = {
  id: string;
  name: string;
  role: string;
};

type DeduplicatedMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  homes: { homeId: string; homeName: string; role: string; membershipId: string }[];
};

interface AllMembersPageProps {
  userId: string;
  homes: HomeInfo[];
  allMembers: RawMember[];
  adminHomeIds: string[];
  adminHomes: { id: string; name: string }[];
}

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  guest: "bg-gray-100 text-gray-800",
};

function getInitials(name: string | null, email: string): string {
  return (name || email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function deduplicateMembers(allMembers: RawMember[], homes: HomeInfo[]): DeduplicatedMember[] {
  const homeMap = new Map(homes.map((h) => [h.id, h.name]));
  const map = new Map<string, DeduplicatedMember>();

  for (const m of allMembers) {
    const existing = map.get(m.user_id);
    const homeEntry = {
      homeId: m.home_id,
      homeName: homeMap.get(m.home_id) ?? "Unknown",
      role: m.role,
      membershipId: m.id,
    };

    if (existing) {
      existing.homes.push(homeEntry);
    } else {
      map.set(m.user_id, {
        user_id: m.user_id,
        email: m.profiles.email,
        display_name: m.profiles.display_name,
        avatar_url: m.profiles.avatar_url,
        homes: [homeEntry],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    (a.display_name || a.email).localeCompare(b.display_name || b.email)
  );
}

export function AllMembersPage({
  userId,
  homes,
  allMembers: initialMembers,
  adminHomeIds,
  adminHomes,
}: AllMembersPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [allMembers, setAllMembers] = useState(initialMembers);
  const [removeConfirm, setRemoveConfirm] = useState<{
    membershipId: string;
    memberName: string;
    homeName: string;
  } | null>(null);

  const members = deduplicateMembers(allMembers, homes);

  async function handleAddToHome(targetUserId: string, homeId: string) {
    const { error } = await supabase.from("home_members").insert({
      home_id: homeId,
      user_id: targetUserId,
      role: "member",
      invite_status: "accepted",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add member to home.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Member added!" });
      router.refresh();
      // Optimistically refetch
      const { data } = await supabase
        .from("home_members")
        .select("id, home_id, user_id, role, profiles(id, email, display_name, avatar_url)")
        .in("home_id", homes.map((h) => h.id))
        .eq("invite_status", "accepted");
      if (data) setAllMembers(data as unknown as RawMember[]);
    }
  }

  async function handleRemoveFromHome(membershipId: string) {
    const { error } = await supabase
      .from("home_members")
      .delete()
      .eq("id", membershipId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove member.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Member removed." });
      setAllMembers((prev) => prev.filter((m) => m.id !== membershipId));
      router.refresh();
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Members</h1>
          <p className="text-[var(--muted-foreground)]">
            Members across all your homes.
          </p>
        </div>
        {adminHomes.length > 0 && (
          <InviteDialog
            homes={adminHomes}
            userId={userId}
            onInviteCreated={() => router.refresh()}
          />
        )}
      </div>

      <AlertDialog
        open={!!removeConfirm}
        onOpenChange={(open) => {
          if (!open) setRemoveConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-[var(--foreground)]">
                {removeConfirm?.memberName}
              </span>{" "}
              from{" "}
              <span className="font-medium text-[var(--foreground)]">
                {removeConfirm?.homeName}
              </span>
              ? They will lose access to this home.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90"
              onClick={() => {
                if (removeConfirm) {
                  handleRemoveFromHome(removeConfirm.membershipId);
                  setRemoveConfirm(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border border-[var(--border)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Homes</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const initials = getInitials(member.display_name, member.email);
            const memberHomeIds = new Set(member.homes.map((h) => h.homeId));
            // Homes this member is NOT in, where current user is admin
            const addableHomes = homes.filter(
              (h) => !memberHomeIds.has(h.id) && adminHomeIds.includes(h.id)
            );

            return (
              <TableRow key={member.user_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.display_name || member.email}
                        {member.user_id === userId && (
                          <span className="text-[var(--muted-foreground)]"> (you)</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {member.homes.map((h) => {
                      const canRemove =
                        adminHomeIds.includes(h.homeId) &&
                        h.role !== "owner" &&
                        member.user_id !== userId;

                      return (
                        <Badge
                          key={h.homeId}
                          variant="outline"
                          className={`${roleColors[h.role] ?? ""} gap-1`}
                        >
                          {h.homeName}
                          {canRemove && (
                            <button
                              onClick={() =>
                                setRemoveConfirm({
                                  membershipId: h.membershipId,
                                  memberName: member.display_name || member.email,
                                  homeName: h.homeName,
                                })
                              }
                              className="ml-0.5 hover:text-[var(--destructive)] transition-colors"
                              title={`Remove from ${h.homeName}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  {member.user_id !== userId && (
                    addableHomes.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {addableHomes.map((home) => (
                            <DropdownMenuItem
                              key={home.id}
                              onClick={() => handleAddToHome(member.user_id, home.id)}
                            >
                              {home.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button variant="ghost" size="sm" className="h-8" disabled>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Already a member of all your homes
                        </TooltipContent>
                      </Tooltip>
                    )
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-[var(--muted-foreground)]">
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </TooltipProvider>
  );
}
