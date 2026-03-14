"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Calendar,
  CalendarIcon,
  User,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  Pencil,
  Camera,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils/cn";
import type { TaskWithProfiles, MemberOption } from "@/app/(dashboard)/home/[homeId]/tasks/page";

interface TaskDetailDialogProps {
  task: TaskWithProfiles;
  homeId: string;
  userId: string;
  isAdmin: boolean;
  members: MemberOption[];
  onClose: () => void;
  onUpdated: (task: TaskWithProfiles) => void;
  onDeleted: (taskId: string) => void;
}

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
  },
  done: {
    label: "Done",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle2,
  },
} as const;

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskDetailDialog({
  task,
  homeId,
  userId,
  isAdmin,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editAssignType, setEditAssignType] = useState(task.assign_type);
  const [editAssignedTo, setEditAssignedTo] = useState(task.assigned_to ?? "");
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const canEdit = task.created_by === userId || isAdmin;
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const isOverdue =
    task.due_date && task.status !== "done" && isPast(parseISO(task.due_date));

  const proofPhotos = task.task_media.filter((m) => m.label === "proof");
  const referencePhotos = task.task_media.filter((m) => m.label === "reference");

  async function handleStatusChange(newStatus: "open" | "in_progress" | "done") {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    } else {
      const updated: TaskWithProfiles = {
        ...task,
        status: data.status,
        updated_at: data.updated_at,
      };
      toast({ title: `Task marked as ${statusConfig[newStatus].label.toLowerCase()}` });
      onUpdated(updated);
    }
    setLoading(false);
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please give your task a name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const updateData = {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      assign_type: editAssignType as "member" | "next_visitor",
      assigned_to:
        editAssignType === "member" && editAssignedTo ? editAssignedTo : null,
      due_date: editDueDate || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    } else {
      const assignedMember =
        data.assigned_to
          ? members.find((m) => m.user_id === data.assigned_to)
          : null;

      const updated: TaskWithProfiles = {
        ...task,
        ...data,
        assigned_profile: assignedMember
          ? {
              id: assignedMember.user_id,
              display_name: assignedMember.display_name,
              avatar_url: assignedMember.avatar_url,
            }
          : null,
      };
      toast({ title: "Task updated!" });
      onUpdated(updated);
      setEditing(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Task deleted." });
      onDeleted(task.id);
    }
    setDeleting(false);
  }

  async function handlePhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    label: "proof" | "reference"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const filePath = `${homeId}/tasks/${task.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("home-media")
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("home-media").getPublicUrl(filePath);

    // Insert task_media record
    const { data: mediaData, error: mediaError } = await supabase
      .from("task_media")
      .insert({
        task_id: task.id,
        media_type: "image",
        url: publicUrl,
        label: label,
      })
      .select()
      .single();

    if (mediaError) {
      toast({
        title: "Error",
        description: "Image uploaded but failed to save record.",
        variant: "destructive",
      });
    } else {
      const updatedTask: TaskWithProfiles = {
        ...task,
        task_media: [...task.task_media, mediaData],
      };
      toast({ title: label === "proof" ? "Proof photo added!" : "Reference photo added!" });
      onUpdated(updatedTask);
    }
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Edit mode rendering
  if (editing) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the task details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select
                value={editAssignType}
                onValueChange={(val: "member" | "next_visitor") => {
                  setEditAssignType(val);
                  if (val === "next_visitor") setEditAssignedTo("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Specific member</SelectItem>
                  <SelectItem value="next_visitor">Next visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editAssignType === "member" && (
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.display_name ?? "Unknown member"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Due date</Label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDueDate && "text-[var(--muted-foreground)]"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDueDate
                      ? format(parseISO(editDueDate), "MMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <CalendarPicker
                    mode="single"
                    selected={editDueDate ? parseISO(editDueDate) : undefined}
                    onSelect={(date) =>
                      setEditDueDate(date ? format(date, "yyyy-MM-dd") : "")
                    }
                    defaultMonth={editDueDate ? parseISO(editDueDate) : undefined}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                // Reset edit values back to current task
                setEditTitle(task.title);
                setEditDescription(task.description ?? "");
                setEditAssignType(task.assign_type);
                setEditAssignedTo(task.assigned_to ?? "");
                setEditDueDate(task.due_date ?? "");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // View mode rendering
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <StatusIcon
              className={cn(
                "h-5 w-5 mt-0.5 shrink-0",
                task.status === "open" && "text-blue-500",
                task.status === "in_progress" && "text-amber-500",
                task.status === "done" && "text-green-500"
              )}
            />
            <span className={cn(task.status === "done" && "line-through")}>
              {task.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
            {task.is_recurring && (
              <Badge variant="secondary" className="text-xs">
                Recurring
              </Badge>
            )}
            {isOverdue && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-300 text-xs"
              >
                Overdue
              </Badge>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="text-sm">
              <p className="font-medium mb-1">Description</p>
              <p className="text-[var(--muted-foreground)] whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignment */}
            <div className="flex items-center gap-2 text-sm">
              {task.assign_type === "next_visitor" ? (
                <>
                  <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <div>
                    <p className="font-medium">Next visitor</p>
                    <p className="text-[var(--muted-foreground)] text-xs">
                      Assigned to whoever visits next
                    </p>
                  </div>
                </>
              ) : task.assigned_profile ? (
                <>
                  <Avatar className="h-6 w-6">
                    {task.assigned_profile.avatar_url && (
                      <AvatarImage src={task.assigned_profile.avatar_url} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(task.assigned_profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {task.assigned_profile.display_name ?? "Unknown"}
                    </p>
                    <p className="text-[var(--muted-foreground)] text-xs">Assigned</p>
                  </div>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <div>
                    <p className="font-medium">Unassigned</p>
                    <p className="text-[var(--muted-foreground)] text-xs">
                      No one assigned yet
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
              <div>
                <p
                  className={cn(
                    "font-medium",
                    isOverdue && "text-red-600"
                  )}
                >
                  {task.due_date
                    ? format(parseISO(task.due_date), "MMM d, yyyy")
                    : "No due date"}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">Due date</p>
              </div>
            </div>

            {/* Created by */}
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                {task.creator_profile.avatar_url && (
                  <AvatarImage src={task.creator_profile.avatar_url} />
                )}
                <AvatarFallback className="text-[10px]">
                  {getInitials(task.creator_profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {task.creator_profile.display_name ?? "Unknown"}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">Created by</p>
              </div>
            </div>

            {/* Created date */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
              <div>
                <p className="font-medium">
                  {format(parseISO(task.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">Created</p>
              </div>
            </div>
          </div>

          {/* Reference photos */}
          {referencePhotos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Reference photos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {referencePhotos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden border border-[var(--border)] hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo.url}
                      alt="Reference"
                      className="w-full h-24 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Proof photos */}
          {proofPhotos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Proof of completion</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {proofPhotos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden border border-[var(--border)] hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo.url}
                      alt="Proof"
                      className="w-full h-24 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Upload proof photo (visible when task is in_progress or being marked done) */}
          {task.status !== "done" && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-sm font-medium mb-2">Add a photo</p>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "proof")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Camera />
                  )}
                  {uploading ? "Uploading..." : "Upload proof photo"}
                </Button>
              </div>
            </div>
          )}

          {/* Status change buttons */}
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Change status</p>
            <div className="flex flex-wrap gap-2">
              {task.status !== "open" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("open")}
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin" />}
                  <Circle className="h-4 w-4 text-blue-500" />
                  Mark open
                </Button>
              )}
              {task.status !== "in_progress" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin" />}
                  <Clock className="h-4 w-4 text-amber-500" />
                  Mark in progress
                </Button>
              )}
              {task.status !== "done" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("done")}
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin" />}
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Mark done
                </Button>
              )}
            </div>
          </div>

          {/* Edit / Delete actions for creators and admins */}
          {canEdit && (
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="flex-1"
                >
                  <Pencil />
                  Edit
                </Button>
                {confirmDelete ? (
                  <div className="flex gap-2 flex-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1"
                    >
                      {deleting && <Loader2 className="animate-spin" />}
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="flex-1 text-[var(--destructive)] hover:text-[var(--destructive)]"
                  >
                    <Trash2 />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
