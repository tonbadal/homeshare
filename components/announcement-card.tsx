"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pin,
  PinOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/use-toast";
import type { Tables } from "@/lib/types/database.types";

type ProfileData = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type CommentWithProfile = Tables<"comments"> & {
  profiles: ProfileData;
};

type AnnouncementWithProfile = Tables<"announcements"> & {
  profiles: ProfileData;
  comments: CommentWithProfile[];
};

interface AnnouncementCardProps {
  announcement: AnnouncementWithProfile;
  userId: string;
  isAdmin: boolean;
  onUpdated: (announcement: AnnouncementWithProfile) => void;
  onDeleted: (announcementId: string) => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AnnouncementCard({
  announcement,
  userId,
  isAdmin,
  onUpdated,
  onDeleted,
}: AnnouncementCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(announcement.title);
  const [editBody, setEditBody] = useState(announcement.body);
  const [editLoading, setEditLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  const isAuthor = announcement.author_id === userId;
  const canManage = isAdmin || isAuthor;
  const commentCount = announcement.comments.length;

  async function handleTogglePin() {
    setPinLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("announcements")
      .update({ is_pinned: !announcement.is_pinned })
      .eq("id", announcement.id)
      .select("*, profiles!announcements_author_id_fkey(id, display_name, avatar_url)")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update pin status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: data.is_pinned ? "Announcement pinned" : "Announcement unpinned",
      });
      onUpdated({ ...data, comments: announcement.comments } as AnnouncementWithProfile);
    }
    setPinLoading(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim() || !editBody.trim()) return;

    setEditLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title: editTitle.trim(),
        body: editBody.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcement.id)
      .select("*, profiles!announcements_author_id_fkey(id, display_name, avatar_url)")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update announcement.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Announcement updated" });
      onUpdated({ ...data, comments: announcement.comments } as AnnouncementWithProfile);
      setShowEditDialog(false);
    }
    setEditLoading(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement.",
        variant: "destructive",
      });
      setDeleteLoading(false);
    } else {
      toast({ title: "Announcement deleted" });
      onDeleted(announcement.id);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;

    setSubmittingComment(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("comments")
      .insert({
        announcement_id: announcement.id,
        author_id: userId,
        body: commentBody.trim(),
      })
      .select("*, profiles!comments_author_id_fkey(id, display_name, avatar_url)")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    } else {
      const updatedComments = [...announcement.comments, data as CommentWithProfile];
      onUpdated({ ...announcement, comments: updatedComments });
      setCommentBody("");
      toast({ title: "Comment posted" });
    }
    setSubmittingComment(false);
  }

  return (
    <>
      <Card className={cn(announcement.is_pinned && "border-[var(--primary)]/30")}>
        <CardContent className="p-5">
          {/* Header: author info + actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={announcement.profiles.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(announcement.profiles.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {announcement.profiles.display_name || "Unknown member"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatDistanceToNow(new Date(announcement.created_at), {
                    addSuffix: true,
                  })}
                  {announcement.updated_at !== announcement.created_at && " (edited)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {announcement.is_pinned && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={handleTogglePin}
                        disabled={pinLoading}
                      >
                        {announcement.is_pinned ? (
                          <>
                            <PinOff className="h-4 w-4" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4" />
                            Pin to top
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {canManage && (
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canManage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleDelete}
                          disabled={deleteLoading}
                          className="text-[var(--destructive)]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Title and body */}
          <div className="mt-3">
            <h3 className="font-semibold text-base">{announcement.title}</h3>
            <p className="text-sm text-[var(--foreground)] mt-1 whitespace-pre-wrap">
              {announcement.body}
            </p>
          </div>

          {/* Comment toggle */}
          <div className="mt-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {commentCount === 0
                ? "Add a comment"
                : `${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
            </button>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="mt-3">
              <Separator className="mb-3" />

              {/* Comment list */}
              {announcement.comments.length > 0 && (
                <div className="space-y-3 mb-3">
                  {announcement.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarImage
                          src={comment.profiles.avatar_url ?? undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(comment.profiles.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium truncate">
                            {comment.profiles.display_name || "Unknown"}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mt-0.5 whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0 mt-1">
                  <AvatarFallback className="text-[10px]">You</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    rows={1}
                    className="min-h-[36px] resize-none text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={submittingComment || !commentBody.trim()}
                    className="h-9 w-9 shrink-0"
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Post comment</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
            <DialogDescription>
              Update the title or body of your announcement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-body">Body</Label>
              <Textarea
                id="edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
