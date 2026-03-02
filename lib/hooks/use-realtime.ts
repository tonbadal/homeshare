"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "bookings" | "tasks" | "announcements" | "comments" | "notifications";

interface UseRealtimeOptions<T> {
  table: TableName;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
}

export function useRealtime<T extends Record<string, unknown>>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  useEffect(() => {
    const supabase = createClient();

    const channelConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*";
      schema: string;
      table: string;
      filter?: string;
    } = {
      event: "*",
      schema: "public",
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes" as never,
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.eventType === "INSERT" && onInsert) {
            onInsert(payload.new as T);
          }
          if (payload.eventType === "UPDATE" && onUpdate) {
            onUpdate(payload.new as T);
          }
          if (payload.eventType === "DELETE" && onDelete) {
            onDelete(payload.old as T);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onInsert, onUpdate, onDelete]);
}
