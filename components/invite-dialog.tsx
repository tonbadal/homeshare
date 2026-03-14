"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Link2, Loader2, UserPlus } from "lucide-react";

interface InviteDialogProps {
  homeId: string;
  userId: string;
  trigger?: React.ReactNode;
  onInviteCreated?: () => void;
}

export function InviteDialog({
  homeId,
  userId,
  trigger,
  onInviteCreated,
}: InviteDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  async function handleGenerate() {
    setLoading(true);
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from("invites").insert({
      home_id: homeId,
      invited_by: userId,
      code,
      role: inviteRole,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create invite.",
        variant: "destructive",
      });
    } else {
      const link = `${window.location.origin}/invite/${code}`;
      setGeneratedLink(link);
      onInviteCreated?.();
    }
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedLink);
    toast({ title: "Link copied!" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setGeneratedLink("");
          setInviteRole("member");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a family member</DialogTitle>
          <DialogDescription>
            Generate an invite link to share. It expires in 7 days.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as "member" | "admin")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  Member — can book stays and create tasks
                </SelectItem>
                <SelectItem value="admin">
                  Admin — can approve bookings and edit manual
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {generatedLink ? (
            <div className="space-y-2">
              <Label>Invite link</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Share this link with the person you want to invite.
              </p>
            </div>
          ) : (
            <DialogFooter>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Generate link
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
