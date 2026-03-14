"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Copy, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
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

interface HomeSettingsProps {
  home: Tables<"homes">;
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

export function HomeSettings({
  home,
  members: initialMembers,
  invites: initialInvites,
  isAdmin,
  userId,
  homeId,
}: HomeSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [name, setName] = useState(home.name);
  const [address, setAddress] = useState(home.address ?? "");
  const [description, setDescription] = useState(home.description ?? "");
  const [approvalPolicy, setApprovalPolicy] = useState(home.approval_policy);
  const [saving, setSaving] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState(home.cover_image_url ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    const ext = file.name.split(".").pop();
    const filePath = `${homeId}/cover.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("home-media")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again or use a smaller file.",
        variant: "destructive",
      });
      setUploadingCover(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("home-media").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("homes")
      .update({ cover_image_url: publicUrl })
      .eq("id", homeId);

    if (updateError) {
      toast({
        title: "Upload failed",
        description: "The image was uploaded but we couldn't save it. Please try again.",
        variant: "destructive",
      });
    } else {
      setCoverImageUrl(publicUrl);
      toast({ title: "Cover image updated!" });
      router.refresh();
    }

    setUploadingCover(false);
    // Reset file input so the same file can be re-selected
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  async function handleDeleteCover() {
    setUploadingCover(true);

    // Remove all cover files from storage (cover.jpg, cover.png, etc.)
    const { data: files } = await supabase.storage
      .from("home-media")
      .list(homeId, { search: "cover" });

    if (files && files.length > 0) {
      await supabase.storage
        .from("home-media")
        .remove(files.map((f) => `${homeId}/${f.name}`));
    }

    const { error } = await supabase
      .from("homes")
      .update({ cover_image_url: null })
      .eq("id", homeId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not remove the cover image. Please try again.",
        variant: "destructive",
      });
    } else {
      setCoverImageUrl("");
      toast({ title: "Cover image removed." });
      router.refresh();
    }

    setUploadingCover(false);
  }

  async function handleSaveHome(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("homes")
      .update({
        name,
        address: address || null,
        description: description || null,
        approval_policy: approvalPolicy,
      })
      .eq("id", homeId);

    if (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } else {
      toast({ title: "Settings saved!" });
      router.refresh();
    }
    setSaving(false);
  }

  async function handleRefreshInvites() {
    const { data } = await supabase
      .from("invites")
      .select("*, profiles!invites_invited_by_fkey(display_name)")
      .eq("home_id", homeId)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
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

  async function handleDeleteInvite(inviteId: string) {
    const { error } = await supabase.from("invites").delete().eq("id", inviteId);
    if (!error) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({ title: "Invite deleted." });
    }
  }

  return (
    <div className="space-y-6">
      {/* Home details */}
      <Card>
        <CardHeader>
          <CardTitle>Home Details</CardTitle>
          <CardDescription>Update your home&apos;s information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveHome} className="space-y-4">
            {/* Cover image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              {coverImageUrl ? (
                <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt={`${home.name} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full aspect-[3/1] rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No cover image yet
                  </p>
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {coverImageUrl ? "Change image" : "Upload image"}
                  </Button>
                  {coverImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingCover}
                      onClick={handleDeleteCover}
                      className="text-[var(--destructive)]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="home-name">Name</Label>
              <Input
                id="home-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-address">Address</Label>
              <Input
                id="home-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-desc">Description</Label>
              <Textarea
                id="home-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin}
                rows={3}
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>Booking approval policy</Label>
                <Select
                  value={approvalPolicy}
                  onValueChange={(v) => setApprovalPolicy(v as "any_admin" | "all_admins")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any_admin">Any admin can approve</SelectItem>
                    <SelectItem value="all_admins">All admins must approve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isAdmin && (
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
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

      {/* Pending invites */}
      {isAdmin && invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Invite links that haven&apos;t been used yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => {
                const inviteUrl = `${window.location.origin}/invite/${invite.code}`;
                return (
                  <div key={invite.id} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-[var(--muted)] px-2 py-1 rounded truncate">
                          {inviteUrl}
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          {invite.role}
                        </Badge>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        expires {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
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
                      onClick={() => handleDeleteInvite(invite.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
