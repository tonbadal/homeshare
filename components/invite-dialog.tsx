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
  homeId?: string;
  homes?: { id: string; name: string }[];
  userId: string;
  trigger?: React.ReactNode;
  onInviteCreated?: () => void;
}

export function InviteDialog({
  homeId: fixedHomeId,
  homes,
  userId,
  trigger,
  onInviteCreated,
}: InviteDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [selectedHomeId, setSelectedHomeId] = useState(fixedHomeId ?? "");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [maxUses, setMaxUses] = useState("");
  const [expiration, setExpiration] = useState<"7" | "30" | "never">("7");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const homeId = fixedHomeId ?? selectedHomeId;
  const showHomeSelector = !fixedHomeId && homes && homes.length > 0;

  async function handleGenerate() {
    setLoading(true);
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    let expiresAt: string | null = null;
    if (expiration !== "never") {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expiration, 10));
      expiresAt = d.toISOString();
    }

    const parsedMaxUses = maxUses ? parseInt(maxUses, 10) : null;

    const { error } = await supabase.from("invites").insert({
      home_id: homeId,
      invited_by: userId,
      code,
      role: inviteRole,
      expires_at: expiresAt,
      max_uses: parsedMaxUses,
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
          setSelectedHomeId(fixedHomeId ?? "");
          setInviteRole("member");
          setMaxUses("");
          setExpiration("7");
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
          <DialogTitle>Invite family members</DialogTitle>
          <DialogDescription>
            Generate a reusable invite link to share with one or more people.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showHomeSelector && (
            <div className="space-y-2">
              <Label>Home</Label>
              <Select
                value={selectedHomeId}
                onValueChange={setSelectedHomeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a home" />
                </SelectTrigger>
                <SelectContent>
                  {homes.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
          <div className="space-y-2">
            <Label>Max uses</Label>
            <Input
              type="number"
              min="1"
              placeholder="Unlimited"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Expires</Label>
            <Select
              value={expiration}
              onValueChange={(v) => setExpiration(v as "7" | "30" | "never")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
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
              <Button onClick={handleGenerate} disabled={loading || !homeId}>
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
