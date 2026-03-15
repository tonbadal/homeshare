"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  differenceInCalendarDays,
  isWithinInterval,
  isBefore,
  startOfDay,
  max as dateMax,
  min as dateMin,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, List, ChevronDown, ChevronUp, Users, MessageSquare } from "lucide-react";
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
  home_id: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    email: string;
  };
};

type HomeInfo = {
  id: string;
  name: string;
  role: string;
};

interface AllStaysCalendarProps {
  userId: string;
  homes: HomeInfo[];
  bookings: BookingWithProfile[];
  members: MemberData[];
  adminHomeIds: string[];
}

type WeekBookingLane = {
  booking: BookingWithProfile;
  startCol: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-300" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-300" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-800 border-gray-300" },
};

const PAGE_SIZE = 5;

export function AllStaysCalendar({
  userId,
  homes,
  bookings: initialBookings,
  members,
  adminHomeIds,
}: AllStaysCalendarProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProfile | null>(null);

  // Color-code by home
  const homeColorMap = useMemo(() => {
    const map: Record<string, (typeof MEMBER_COLORS)[0]> = {};
    homes.forEach((h, i) => {
      map[h.id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
    });
    return map;
  }, [homes]);

  const homeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    homes.forEach((h) => {
      map[h.id] = h.name;
    });
    return map;
  }, [homes]);

  // Only show pending/approved on the calendar grid
  const calendarBookings = useMemo(
    () => bookings.filter((b) => b.status !== "declined" && b.status !== "cancelled"),
    [bookings]
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function getWeekBookingLanes(weekDays: Date[]): WeekBookingLane[][] {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];
    const lanes: WeekBookingLane[][] = [];

    const overlapping = calendarBookings
      .filter((b) => {
        const bStart = parseISO(b.start_date);
        const bEnd = parseISO(b.end_date);
        return bStart <= weekEnd && bEnd >= weekStart;
      })
      .sort((a, b) => {
        const aStart = parseISO(a.start_date);
        const bStart = parseISO(b.start_date);
        if (aStart.getTime() !== bStart.getTime())
          return aStart.getTime() - bStart.getTime();
        const aDur = differenceInCalendarDays(parseISO(a.end_date), parseISO(a.start_date));
        const bDur = differenceInCalendarDays(parseISO(b.end_date), parseISO(b.start_date));
        return bDur - aDur;
      });

    for (const booking of overlapping) {
      const bStart = parseISO(booking.start_date);
      const bEnd = parseISO(booking.end_date);
      const visibleStart = dateMax([bStart, weekStart]);
      const visibleEnd = dateMin([bEnd, weekEnd]);
      const startCol = differenceInCalendarDays(visibleStart, weekStart);
      const span = differenceInCalendarDays(visibleEnd, visibleStart) + 1;
      const isStart = bStart >= weekStart;
      const isEnd = bEnd <= weekEnd;

      const lane: WeekBookingLane = { booking, startCol, span, isStart, isEnd };

      let placed = false;
      for (let r = 0; r < lanes.length; r++) {
        const conflict = lanes[r].some(
          (existing) =>
            startCol < existing.startCol + existing.span &&
            startCol + span > existing.startCol
        );
        if (!conflict) {
          lanes[r].push(lane);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanes.push([lane]);
      }
    }

    return lanes;
  }

  function handleBookingUpdated(updated: BookingWithProfile) {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    setSelectedBooking(null);
  }

  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MAX_VISIBLE_LANES = 3;

  // --- List view data ---
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
    up.sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime());
    pa.sort((a, b) => parseISO(b.start_date).getTime() - parseISO(a.start_date).getTime());
    inact.sort((a, b) => parseISO(b.start_date).getTime() - parseISO(a.start_date).getTime());
    return { upcoming: up, past: pa, inactive: inact };
  }, [bookings, today]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const [inactivePage, setInactivePage] = useState(0);

  function renderBookingCard(booking: BookingWithProfile) {
    const color = homeColorMap[booking.home_id];
    const status = statusConfig[booking.status] ?? statusConfig.pending;
    const isExpanded = expandedId === booking.id;
    const startDate = parseISO(booking.start_date);
    const endDate = parseISO(booking.end_date);

    return (
      <div
        key={booking.id}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all"
      >
        <button
          onClick={() => setExpandedId((prev) => (prev === booking.id ? null : booking.id))}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--muted)]/50 transition-colors"
        >
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: color?.hex ?? "var(--muted)" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm truncate">
                {booking.profiles.display_name || "Unknown"}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[var(--muted)]">
                {homeNameMap[booking.home_id] || "Unknown home"}
              </Badge>
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

  const upcomingSlice = upcoming.slice(0, (upcomingPage + 1) * PAGE_SIZE);
  const pastSlice = past.slice(0, (pastPage + 1) * PAGE_SIZE);
  const inactiveSlice = inactive.slice(0, (inactivePage + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--muted)] rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-md",
                view === "calendar" && "bg-[var(--background)] shadow-sm"
              )}
              onClick={() => setView("calendar")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-md",
                view === "list" && "bg-[var(--background)] shadow-sm"
              )}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Month navigation - only in calendar view */}
          {view === "calendar" && (
            <div className="flex items-center bg-[var(--muted)] rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm font-semibold hover:bg-[var(--background)] rounded-md transition-colors"
              >
                {format(currentMonth, "MMMM yyyy")}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* List view */}
      {view === "list" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Upcoming stays ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-sm text-[var(--muted-foreground)] py-6 text-center rounded-xl border border-dashed border-[var(--border)]">
                No upcoming stays across your homes.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSlice.map(renderBookingCard)}
                {upcomingSlice.length < upcoming.length && (
                  <Button variant="ghost" className="w-full text-sm" onClick={() => setUpcomingPage((p) => p + 1)}>
                    Show more
                  </Button>
                )}
              </div>
            )}
          </section>

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
                {pastSlice.length < past.length && (
                  <Button variant="ghost" className="w-full text-sm" onClick={() => setPastPage((p) => p + 1)}>
                    Show more
                  </Button>
                )}
              </div>
            )}
          </section>

          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                Cancelled & declined ({inactive.length})
              </h2>
              <div className="space-y-2 opacity-75">
                {inactiveSlice.map(renderBookingCard)}
                {inactiveSlice.length < inactive.length && (
                  <Button variant="ghost" className="w-full text-sm" onClick={() => setInactivePage((p) => p + 1)}>
                    Show more
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        <>
          {/* Home legend */}
          {calendarBookings.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
              {homes.map((h) => {
                const color = homeColorMap[h.id];
                return (
                  <div key={h.id} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: color?.hex }}
                    />
                    <span className="text-[var(--muted-foreground)]">{h.name}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--muted)] border border-dashed border-[var(--border)]" />
                Pending
              </div>
            </div>
          )}

          {calendarBookings.length === 0 && (
            <div className="flex items-center gap-2 mb-4 py-3 px-4 rounded-lg bg-[var(--muted)]/50 text-sm text-[var(--muted-foreground)]">
              <Calendar className="h-4 w-4 shrink-0" />
              No stays across your homes yet. Head to a home&apos;s calendar to add one.
            </div>
          )}

          {/* Calendar grid */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)] select-none">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {weekDayLabels.map((day) => (
                <div
                  key={day}
                  className="py-2.5 text-center text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Week rows */}
            {weeks.map((weekDays, weekIdx) => {
              const lanes = getWeekBookingLanes(weekDays);
              const hasOverflow = lanes.length > MAX_VISIBLE_LANES;
              const visibleLanes = lanes.slice(0, MAX_VISIBLE_LANES);
              const bookingRowCount =
                Math.max(visibleLanes.length, 0) + (hasOverflow ? 1 : 0);

              return (
                <div
                  key={weekIdx}
                  className={cn(
                    "grid grid-cols-7",
                    weekIdx < weeks.length - 1 && "border-b border-[var(--border)]"
                  )}
                >
                  {/* Day numbers row */}
                  {weekDays.map((day, dayIdx) => {
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "pt-1.5 pb-1 px-1 sm:px-2 text-right",
                          dayIdx > 0 && "border-l border-[var(--border)]",
                          !isCurrentMonth && "bg-[var(--muted)]/40"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex items-center justify-center text-xs w-6 h-6 rounded-full",
                            isToday &&
                              "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold",
                            !isToday && isCurrentMonth && "text-[var(--foreground)]",
                            !isCurrentMonth && "text-[var(--muted-foreground)]"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  })}

                  {/* Booking lanes */}
                  <div
                    className="col-span-7 relative"
                    style={{
                      minHeight:
                        bookingRowCount > 0
                          ? `${bookingRowCount * 26 + 4}px`
                          : "8px",
                    }}
                  >
                    {visibleLanes.map((laneBars, laneIdx) =>
                      laneBars.map((bar) => {
                        const color = homeColorMap[bar.booking.home_id];
                        const isPending = bar.booking.status === "pending";
                        const isDeclined = bar.booking.status === "declined";
                        const leftPercent = (bar.startCol / 7) * 100;
                        const widthPercent = (bar.span / 7) * 100;
                        const displayName =
                          bar.booking.profiles.display_name || "Booking";
                        const homeName = homeNameMap[bar.booking.home_id];

                        return (
                          <button
                            key={`${bar.booking.id}-${bar.startCol}`}
                            onClick={() => setSelectedBooking(bar.booking)}
                            className={cn(
                              "absolute h-[22px] text-[11px] sm:text-xs font-medium px-2 truncate transition-all hover:brightness-95 hover:shadow-sm cursor-pointer",
                              bar.isStart ? "rounded-l-full" : "rounded-l-none",
                              bar.isEnd ? "rounded-r-full" : "rounded-r-none",
                              !bar.isStart && !bar.isEnd && "rounded-none",
                              isPending
                                ? "bg-[var(--muted)] border border-dashed border-[var(--border)] text-[var(--muted-foreground)]"
                                : isDeclined
                                  ? "bg-red-100 border border-red-300 text-red-400 line-through"
                                  : "text-white"
                            )}
                            style={{
                              left: `calc(${leftPercent}% + 3px)`,
                              width: `calc(${widthPercent}% - 6px)`,
                              top: `${laneIdx * 26 + 2}px`,
                              ...(!isPending && !isDeclined
                                ? { backgroundColor: color?.hex }
                                : {}),
                            }}
                          >
                            {bar.isStart ? `${displayName} · ${homeName}` : ""}
                          </button>
                        );
                      })
                    )}
                    {/* Overflow indicators */}
                    {hasOverflow &&
                      weekDays.map((day, dayIdx) => {
                        const hiddenCount = lanes
                          .slice(MAX_VISIBLE_LANES)
                          .reduce((count, lane) => {
                            return (
                              count +
                              lane.filter((bar) => {
                                const bStart = parseISO(bar.booking.start_date);
                                const bEnd = parseISO(bar.booking.end_date);
                                return isWithinInterval(day, {
                                  start: bStart,
                                  end: bEnd,
                                });
                              }).length
                            );
                          }, 0);
                        if (hiddenCount === 0) return null;
                        return (
                          <div
                            key={`overflow-${dayIdx}`}
                            className="absolute text-[10px] text-[var(--muted-foreground)] font-medium"
                            style={{
                              left: `calc(${(dayIdx / 7) * 100}% + 8px)`,
                              top: `${MAX_VISIBLE_LANES * 26 + 2}px`,
                            }}
                          >
                            +{hiddenCount} more
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Booking detail sheet */}
      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          isAdmin={adminHomeIds.includes(selectedBooking.home_id)}
          userId={userId}
          homeId={selectedBooking.home_id}
          members={members.filter((m) => m.home_id === selectedBooking.home_id)}
          onClose={() => setSelectedBooking(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
}
