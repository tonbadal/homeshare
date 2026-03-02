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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { TaskWithProfiles, MemberOption } from "@/app/(dashboard)/home/[homeId]/tasks/page";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
  userId: string;
  members: MemberOption[];
  onTaskCreated: (task: TaskWithProfiles) => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  homeId,
  userId,
  members,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignType, setAssignType] = useState<"member" | "next_visitor">("member");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssignType("member");
    setAssignedTo("");
    setDueDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please give your task a name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const insertData = {
      home_id: homeId,
      title: title.trim(),
      description: description.trim() || null,
      assign_type: assignType,
      assigned_to: assignType === "member" && assignedTo ? assignedTo : null,
      created_by: userId,
      due_date: dueDate || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Build the full TaskWithProfiles from the returned data
    const assignedMember = assignedTo
      ? members.find((m) => m.user_id === assignedTo)
      : null;
    const creatorMember = members.find((m) => m.user_id === userId);

    const taskWithProfiles: TaskWithProfiles = {
      ...data,
      assigned_profile: assignedMember
        ? {
            id: assignedMember.user_id,
            display_name: assignedMember.display_name,
            avatar_url: assignedMember.avatar_url,
          }
        : null,
      creator_profile: creatorMember
        ? {
            id: creatorMember.user_id,
            display_name: creatorMember.display_name,
            avatar_url: creatorMember.avatar_url,
          }
        : {
            id: userId,
            display_name: null,
            avatar_url: null,
          },
      task_media: [],
    };

    toast({ title: "Task created!" });
    onTaskCreated(taskWithProfiles);
    resetForm();
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            Create something that needs doing at the house.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Fix the leaky tap in the kitchen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description (optional)</Label>
            <Textarea
              id="task-description"
              placeholder="Any details or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select
              value={assignType}
              onValueChange={(val: "member" | "next_visitor") => {
                setAssignType(val);
                if (val === "next_visitor") setAssignedTo("");
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

          {assignType === "member" && (
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
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
            <Label htmlFor="task-due-date">Due date (optional)</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
