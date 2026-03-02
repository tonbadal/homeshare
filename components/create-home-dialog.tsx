"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function CreateHomeDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    // Create the home (don't .select() yet — the homes_select RLS policy
    // requires home_members membership, which doesn't exist until the next step)
    const { data: home, error: homeError } = await supabase
      .from("homes")
      .insert({
        name,
        address: address || null,
        description: description || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (homeError || !home) {
      toast({
        title: "Error",
        description: homeError?.message || "Failed to create home. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Add the creator as owner
    const { error: memberError } = await supabase.from("home_members").insert({
      home_id: home.id,
      user_id: userId,
      role: "owner",
      invite_status: "accepted",
    });

    if (memberError) {
      toast({
        title: "Error",
        description: "Home created but failed to set you as owner.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({ title: "Home created!", description: `Welcome to ${name}.` });
    setOpen(false);
    setName("");
    setAddress("");
    setDescription("");
    setLoading(false);
    router.push(`/home/${home.id}/calendar`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New home
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new home</DialogTitle>
          <DialogDescription>
            Set up a shared space for your family to coordinate visits.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="home-name">Home name</Label>
            <Input
              id="home-name"
              placeholder="e.g. Villa Mediterránea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="home-address">Address (optional)</Label>
            <Input
              id="home-address"
              placeholder="e.g. 123 Coastal Road, Mallorca"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="home-description">Description (optional)</Label>
            <Textarea
              id="home-description"
              placeholder="Tell your family about this place..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Create home
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
