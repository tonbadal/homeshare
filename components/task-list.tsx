"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  User,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import type { TaskWithProfiles, MemberOption } from "@/app/(dashboard)/home/[homeId]/tasks/page";

interface TaskListProps {
  homeId: string;
  userId: string;
  userRole: "owner" | "admin" | "member" | "guest";
  isAdmin: boolean;
  initialTasks: TaskWithProfiles[];
  members: MemberOption[];
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

export function TaskList({
  homeId,
  userId,
  userRole,
  isAdmin,
  initialTasks,
  members,
}: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithProfiles[]>(initialTasks);
  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithProfiles | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredTasks = useMemo(() => {
    if (activeTab === "all") return tasks;
    return tasks.filter((t) => t.status === activeTab);
  }, [tasks, activeTab]);

  const counts = useMemo(() => {
    const c = { all: tasks.length, open: 0, in_progress: 0, done: 0 };
    for (const t of tasks) {
      c[t.status]++;
    }
    return c;
  }, [tasks]);

  // Build a member lookup for quick access
  const memberMap = useMemo(() => {
    const map = new Map<string, MemberOption>();
    for (const m of members) {
      map.set(m.user_id, m);
    }
    return map;
  }, [members]);

  async function handleStatusChange(
    taskId: string,
    newStatus: "open" | "in_progress" | "done"
  ) {
    setUpdatingId(taskId);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: data.status, updated_at: data.updated_at } : t
        )
      );
      toast({ title: `Task marked as ${statusConfig[newStatus].label.toLowerCase()}` });
    }
    setUpdatingId(null);
  }

  function handleTaskCreated(task: TaskWithProfiles) {
    setTasks((prev) => [task, ...prev]);
    setCreateOpen(false);
  }

  function handleTaskUpdated(updated: TaskWithProfiles) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  }

  function getNextStatus(
    current: "open" | "in_progress" | "done"
  ): "open" | "in_progress" | "done" | null {
    if (current === "open") return "in_progress";
    if (current === "in_progress") return "done";
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList>
              <TabsTrigger value="all">
                All
                <span className="ml-1.5 text-xs opacity-60">{counts.all}</span>
              </TabsTrigger>
              <TabsTrigger value="open">
                Open
                <span className="ml-1.5 text-xs opacity-60">{counts.open}</span>
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress
                <span className="ml-1.5 text-xs opacity-60">{counts.in_progress}</span>
              </TabsTrigger>
              <TabsTrigger value="done">
                Done
                <span className="ml-1.5 text-xs opacity-60">{counts.done}</span>
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus />
              Add task
            </Button>
          </div>

          {/* Empty state for filtered view */}
          {filteredTasks.length === 0 && tasks.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <p className="text-[var(--muted-foreground)]">
                No tasks match this filter.
              </p>
            </div>
          )}

          {/* Empty state for no tasks at all */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <p className="text-[var(--muted-foreground)] mb-4">
                No tasks yet — add one to keep things running smoothly!
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus />
                Create your first task
              </Button>
            </div>
          )}

          {/* Task cards */}
          {filteredTasks.length > 0 && (
            <div className="mt-4 space-y-3">
              {filteredTasks.map((task) => {
                const config = statusConfig[task.status];
                const StatusIcon = config.icon;
                const nextStatus = getNextStatus(task.status);
                const isOverdue =
                  task.due_date &&
                  task.status !== "done" &&
                  isPast(parseISO(task.due_date));

                return (
                  <Card
                    key={task.id}
                    className={cn(
                      "cursor-pointer transition-shadow hover:shadow-md",
                      task.status === "done" && "opacity-70"
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Quick status toggle */}
                        <button
                          type="button"
                          className="mt-0.5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (nextStatus && updatingId !== task.id) {
                              handleStatusChange(task.id, nextStatus);
                            }
                          }}
                          disabled={!nextStatus || updatingId === task.id}
                          title={
                            nextStatus
                              ? `Move to ${statusConfig[nextStatus].label}`
                              : "Task complete"
                          }
                        >
                          {updatingId === task.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                          ) : (
                            <StatusIcon
                              className={cn(
                                "h-5 w-5",
                                task.status === "open" && "text-blue-500",
                                task.status === "in_progress" && "text-amber-500",
                                task.status === "done" && "text-green-500"
                              )}
                            />
                          )}
                        </button>

                        {/* Task content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3
                                className={cn(
                                  "font-medium text-sm leading-snug",
                                  task.status === "done" && "line-through"
                                )}
                              >
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("shrink-0 text-[10px]", config.className)}
                            >
                              {config.label}
                            </Badge>
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[var(--muted-foreground)]">
                            {/* Assignment */}
                            {task.assign_type === "next_visitor" ? (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Next visitor
                              </span>
                            ) : task.assigned_profile ? (
                              <span className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  {task.assigned_profile.avatar_url && (
                                    <AvatarImage src={task.assigned_profile.avatar_url} />
                                  )}
                                  <AvatarFallback className="text-[8px]">
                                    {getInitials(task.assigned_profile.display_name)}
                                  </AvatarFallback>
                                </Avatar>
                                {task.assigned_profile.display_name ?? "Unassigned"}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Unassigned
                              </span>
                            )}

                            {/* Due date */}
                            {task.due_date && (
                              <span
                                className={cn(
                                  "flex items-center gap-1",
                                  isOverdue && "text-red-600 font-medium"
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {isOverdue ? "Overdue: " : "Due "}
                                {format(parseISO(task.due_date), "MMM d")}
                              </span>
                            )}

                            {/* Created by */}
                            <span className="flex items-center gap-1">
                              by {task.creator_profile.display_name ?? "Unknown"}
                            </span>

                            {/* Quick advance button (visible on hover, mobile always) */}
                            {nextStatus && (
                              <button
                                type="button"
                                className="ml-auto flex items-center gap-1 text-[var(--primary)] hover:underline font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (updatingId !== task.id) {
                                    handleStatusChange(task.id, nextStatus);
                                  }
                                }}
                                disabled={updatingId === task.id}
                              >
                                {statusConfig[nextStatus].label}
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </Tabs>
      </div>

      {/* Create dialog */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        homeId={homeId}
        userId={userId}
        members={members}
        onTaskCreated={handleTaskCreated}
      />

      {/* Detail dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          homeId={homeId}
          userId={userId}
          isAdmin={isAdmin}
          members={members}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </>
  );
}
