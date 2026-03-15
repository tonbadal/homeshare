"use client";

import { useState, useMemo } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MEMBER_COLORS } from "@/lib/types";
import { BookingDetailSheet } from "@/components/booking-detail-sheet";
import type { Tables } from "@/lib/types/database.types";

type BookingWithProfile = Tables<"bookings"> & {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type MemberData = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    email: string;
  };
};

interface BookingListViewProps {
  homeId: string;
  userId: string;
  isAdmin: boolean;
  members: MemberData[];
  bookings: BookingWithProfile[];
  onBookingUpdated: (booking: BookingWithProfile) => void;
}

const PAGE_SIZE = 5;

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  declined: {
    label: "Declined",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

export function BookingListView({
  homeId,
  userId,
  isAdmin,
  members,
  bookings,
  onBookingUpdated,
}: BookingListViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithProfile | null>(null);
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const [inactivePage, setInactivePage] = useState(0);

  const memberColorMap = useMemo(() => {
    const map: Record<string, (typeof MEMBER_COLORS)[0]> = {};
    members.forEach((m, i) => {
      map[m.user_id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
    });
    return map;
  }, [members]);

  const today = startOfDay(new Date());

  const { upcoming, past, inactive } = useMemo(() => {
    const up: BookingWithProfile[] = [];
    const pa: BookingWithProfile[] = [];
    const inact: BookingWithProfile[] = [];
    for (const b of bookings) {
      if (b.status === "cancelled" || b.status === "declined") {
        inact.push(b);
      } else if (isBefore(parseISO(b.end_date), today)) {
        pa.push(b);
      } else {
        up.push(b);
      }
    }
    // Upcoming: soonest first
    up.sort(
      (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
    );
    // Past: most recent first
    pa.sort(
      (a, b) => parseISO(b.start_date).getTime() - parseISO(a.start_date).getTime()
    );
    // Inactive: most recent first
    inact.sort(
      (a, b) => parseISO(b.start_date).getTime() - parseISO(a.start_date).getTime()
    );
    return { upcoming: up, past: pa, inactive: inact };
  }, [bookings, today]);

  const upcomingSlice = upcoming.slice(0, (upcomingPage + 1) * PAGE_SIZE);
  const pastSlice = past.slice(0, (pastPage + 1) * PAGE_SIZE);
  const inactiveSlice = inactive.slice(0, (inactivePage + 1) * PAGE_SIZE);
  const hasMoreUpcoming = upcomingSlice.length < upcoming.length;
  const hasMorePast = pastSlice.length < past.length;
  const hasMoreInactive = inactiveSlice.length < inactive.length;

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function renderBookingCard(booking: BookingWithProfile) {
    const color = memberColorMap[booking.requested_by];
    const status = statusConfig[booking.status] ?? statusConfig.pending;
    const isExpanded = expandedId === booking.id;
    const startDate = parseISO(booking.start_date);
    const endDate = parseISO(booking.end_date);

    return (
      <div
        key={booking.id}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all"
      >
        {/* Card header - always visible */}
        <button
          onClick={() => toggleExpand(booking.id)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--muted)]/50 transition-colors"
        >
          {/* Color indicator */}
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: color?.hex ?? "var(--muted)" }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">
                {booking.profiles.display_name || "Unknown"}
              </span>
              <Badge className={cn("text-[10px] px-1.5 py-0", status.className)} variant="outline">
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {booking.guest_count}
              </span>
            </div>
          </div>

          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          )}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]">
            <div className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--muted-foreground)] text-xs">Arrival</p>
                  <p className="font-medium">{format(startDate, "EEEE, MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)] text-xs">Departure</p>
                  <p className="font-medium">{format(endDate, "EEEE, MMM d, yyyy")}</p>
                </div>
              </div>

              {booking.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-[var(--muted-foreground)]" />
                  <p className="text-[var(--muted-foreground)]">{booking.notes}</p>
                </div>
              )}

              {booking.decline_reason && (
                <div className="text-sm p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <p className="font-medium text-red-800 text-xs mb-0.5">Decline reason</p>
                  <p className="text-red-700 text-xs">{booking.decline_reason}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBooking(booking);
                  }}
                >
                  View details
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming stays */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
          Upcoming stays ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="text-sm text-[var(--muted-foreground)] py-6 text-center rounded-xl border border-dashed border-[var(--border)]">
            No upcoming stays. Book one from the calendar view!
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSlice.map(renderBookingCard)}
            {hasMoreUpcoming && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setUpcomingPage((p) => p + 1)}
              >
                Show more
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Past stays */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
          Past stays ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="text-sm text-[var(--muted-foreground)] py-6 text-center rounded-xl border border-dashed border-[var(--border)]">
            No past stays yet.
          </div>
        ) : (
          <div className="space-y-2">
            {pastSlice.map(renderBookingCard)}
            {hasMorePast && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setPastPage((p) => p + 1)}
              >
                Show more
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Cancelled & declined */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
            Cancelled & declined ({inactive.length})
          </h2>
          <div className="space-y-2 opacity-75">
            {inactiveSlice.map(renderBookingCard)}
            {hasMoreInactive && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setInactivePage((p) => p + 1)}
              >
                Show more
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Booking detail sheet */}
      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          isAdmin={isAdmin}
          userId={userId}
          homeId={homeId}
          members={members}
          onClose={() => setSelectedBooking(null)}
          onUpdated={(updated) => {
            onBookingUpdated(updated);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}
