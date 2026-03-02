"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Bell,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { Tables } from "@/lib/types/database.types";

const typeIcons: Record<string, typeof Calendar> = {
  booking_request: Calendar,
  booking_approved: Calendar,
  booking_declined: Calendar,
  task_assigned: CheckSquare,
  announcement: MessageSquare,
  comment: MessageSquare,
};

const typeColors: Record<string, string> = {
  booking_request: "text-blue-600 bg-blue-100",
  booking_approved: "text-green-600 bg-green-100",
  booking_declined: "text-red-600 bg-red-100",
  task_assigned: "text-purple-600 bg-purple-100",
  announcement: "text-amber-600 bg-amber-100",
  comment: "text-teal-600 bg-teal-100",
};

interface NotificationListProps {
  notifications: Tables<"notifications">[];
  homeId: string;
  userId: string;
}

export function NotificationList({
  notifications: initial,
  homeId,
  userId,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState(initial);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("home_id", homeId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    router.refresh();
  }

  function handleClick(notification: Tables<"notifications">) {
    markAsRead(notification.id);
    // Navigate to the relevant page based on type
    if (notification.type.startsWith("booking")) {
      router.push(`/home/${homeId}/calendar`);
    } else if (notification.type === "task_assigned") {
      router.push(`/home/${homeId}/tasks`);
    } else if (notification.type === "announcement" || notification.type === "comment") {
      router.push(`/home/${homeId}/announcements`);
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
        <p className="text-[var(--muted-foreground)]">
          All caught up! No notifications to show.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type] || Bell;
          const colorClass = typeColors[notification.type] || "text-gray-600 bg-gray-100";

          return (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={cn(
                "w-full text-left flex items-start gap-3 p-4 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--muted)]/50",
                !notification.is_read && "bg-[var(--accent)]"
              )}
            >
              <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm", !notification.is_read && "font-semibold")}>
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  {notification.body}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
