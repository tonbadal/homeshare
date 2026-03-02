"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Plus, Loader2, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AnnouncementCard } from "@/components/announcement-card";
import type { Tables } from "@/lib/types/database.types";

type ProfileData = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type CommentWithProfile = Tables<"comments"> & {
  profiles: ProfileData;
};

type AnnouncementWithComments = Tables<"announcements"> & {
  profiles: ProfileData;
  comments: CommentWithProfile[];
};

interface AnnouncementFeedProps {
  homeId: string;
  userId: string;
  isAdmin: boolean;
  initialAnnouncements: AnnouncementWithComments[];
}

export function AnnouncementFeed({
  homeId,
  userId,
  isAdmin,
  initialAnnouncements,
}: AnnouncementFeedProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const { toast } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createTitle.trim() || !createBody.trim()) return;

    setCreateLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        home_id: homeId,
        author_id: userId,
        title: createTitle.trim(),
        body: createBody.trim(),
      })
      .select("*, profiles!announcements_author_id_fkey(id, display_name, avatar_url)")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
    } else {
      const newAnnouncement: AnnouncementWithComments = {
        ...data,
        comments: [],
      };
      // Insert at the correct position: after pinned items, at the top of unpinned
      setAnnouncements((prev) => {
        const pinned = prev.filter((a) => a.is_pinned);
        const unpinned = prev.filter((a) => !a.is_pinned);
        return [...pinned, newAnnouncement, ...unpinned];
      });
      toast({ title: "Announcement posted!" });
      setShowCreateDialog(false);
      setCreateTitle("");
      setCreateBody("");
    }
    setCreateLoading(false);
  }

  function handleAnnouncementUpdated(updated: AnnouncementWithComments) {
    setAnnouncements((prev) => {
      const newList = prev.map((a) => (a.id === updated.id ? updated : a));
      // Re-sort: pinned first, then by created_at descending
      return newList.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });
  }

  function handleAnnouncementDeleted(announcementId: string) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
  }

  if (announcements.length === 0 && initialAnnouncements.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <p className="text-[var(--muted-foreground)] mb-4">
            No announcements yet — post one to keep everyone in the loop!
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New announcement
          </Button>
        </div>

        <CreateAnnouncementDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          title={createTitle}
          onTitleChange={setCreateTitle}
          body={createBody}
          onBodyChange={setCreateBody}
          loading={createLoading}
          onSubmit={handleCreate}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header with create button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New announcement
        </Button>
      </div>

      {/* Announcement feed */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            userId={userId}
            isAdmin={isAdmin}
            onUpdated={handleAnnouncementUpdated}
            onDeleted={handleAnnouncementDeleted}
          />
        ))}
      </div>

      {/* Show empty state if all announcements were deleted */}
      {announcements.length === 0 && initialAnnouncements.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <p className="text-[var(--muted-foreground)]">
            No announcements yet — post one to keep everyone in the loop!
          </p>
        </div>
      )}

      {/* Create dialog */}
      <CreateAnnouncementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={createTitle}
        onTitleChange={setCreateTitle}
        body={createBody}
        onBodyChange={setCreateBody}
        loading={createLoading}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function CreateAnnouncementDialog({
  open,
  onOpenChange,
  title,
  onTitleChange,
  body,
  onBodyChange,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>
            Share something with the family. Everyone in the home will be able to
            see this.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              placeholder="What's this about?"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-body">Message</Label>
            <Textarea
              id="announcement-body"
              placeholder="Share the details..."
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Post announcement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
