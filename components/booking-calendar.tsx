"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
  max as dateMax,
  min as dateMin,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar, List } from "lucide-react";
import { BookingListView } from "@/components/booking-list-view";
import { cn } from "@/lib/utils/cn";
import { MEMBER_COLORS } from "@/lib/types";
import { CreateBookingDialog } from "@/components/create-booking-dialog";
import { BookingDetailSheet } from "@/components/booking-detail-sheet";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { createClient } from "@/lib/supabase/client";
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

interface BookingCalendarProps {
  homeId: string;
  userId: string;
  isAdmin: boolean;
  members: MemberData[];
  initialBookings: BookingWithProfile[];
}

type WeekBookingLane = {
  booking: BookingWithProfile;
  startCol: number; // 0-indexed column within the week
  span: number; // number of days it spans in this week
  isStart: boolean; // booking starts in this week
  isEnd: boolean; // booking ends in this week
};

export function BookingCalendar({
  homeId,
  userId,
  isAdmin,
  members,
  initialBookings,
}: BookingCalendarProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [prefillDates, setPrefillDates] = useState<{ start: string; end: string } | null>(null);

  // Drag-to-select state
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const isDragging = useRef(false);

  const dragRange = useMemo(() => {
    if (!dragStart) return null;
    const end = dragEnd ?? dragStart;
    const from = dragStart <= end ? dragStart : end;
    const to = dragStart <= end ? end : dragStart;
    return { from, to };
  }, [dragStart, dragEnd]);

  const handleDayMouseDown = useCallback((day: Date, e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging.current = true;
    setDragStart(day);
    setDragEnd(null);
  }, []);

  const handleDayMouseEnter = useCallback((day: Date) => {
    if (isDragging.current) {
      setDragEnd(day);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !dragStart) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;
    const end = dragEnd ?? dragStart;
    const from = dragStart <= end ? dragStart : end;
    const to = dragStart <= end ? end : dragStart;
    setPrefillDates({
      start: format(from, "yyyy-MM-dd"),
      end: format(to, "yyyy-MM-dd"),
    });
    setShowCreateDialog(true);
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd]);

  const memberColorMap = useMemo(() => {
    const map: Record<string, (typeof MEMBER_COLORS)[0]> = {};
    members.forEach((m, i) => {
      map[m.user_id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
    });
    return map;
  }, [members]);

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

  // Split days into week rows
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // For each week, compute which bookings appear and in which lane (row)
  function getWeekBookingLanes(weekDays: Date[]): WeekBookingLane[][] {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];
    const lanes: WeekBookingLane[][] = [];

    // Find bookings that overlap this week
    const overlapping = calendarBookings
      .filter((b) => {
        const bStart = parseISO(b.start_date);
        const bEnd = parseISO(b.end_date);
        return bStart <= weekEnd && bEnd >= weekStart;
      })
      .sort((a, b) => {
        // Sort by start date, then by duration (longer first)
        const aStart = parseISO(a.start_date);
        const bStart = parseISO(b.start_date);
        if (aStart.getTime() !== bStart.getTime())
          return aStart.getTime() - bStart.getTime();
        const aDur = differenceInCalendarDays(
          parseISO(a.end_date),
          parseISO(a.start_date)
        );
        const bDur = differenceInCalendarDays(
          parseISO(b.end_date),
          parseISO(b.start_date)
        );
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

      const lane: WeekBookingLane = {
        booking,
        startCol,
        span,
        isStart,
        isEnd,
      };

      // Find the first row where this booking fits without overlapping
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

  // Realtime: keep calendar in sync with other users' changes
  const fetchBookingWithProfile = useCallback(
    async (id: string): Promise<BookingWithProfile | null> => {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)")
        .eq("id", id)
        .single();
      return data as BookingWithProfile | null;
    },
    []
  );

  useRealtime<Tables<"bookings">>({
    table: "bookings",
    filter: `home_id=eq.${homeId}`,
    onInsert: useCallback(
      async (row: Tables<"bookings">) => {
        const booking = await fetchBookingWithProfile(row.id);
        if (booking) {
          setBookings((prev) =>
            prev.some((b) => b.id === booking.id) ? prev : [...prev, booking]
          );
        }
      },
      [fetchBookingWithProfile]
    ),
    onUpdate: useCallback(
      async (row: Tables<"bookings">) => {
        const booking = await fetchBookingWithProfile(row.id);
        if (booking) {
          setBookings((prev) =>
            prev.some((b) => b.id === booking.id)
              ? prev.map((b) => (b.id === booking.id ? booking : b))
              : [...prev, booking]
          );
        }
      },
      [fetchBookingWithProfile]
    ),
    onDelete: useCallback(
      (row: Tables<"bookings">) => {
        setBookings((prev) => prev.filter((b) => b.id !== row.id));
      },
      []
    ),
  });

  function handleBookingCreated(newBooking: BookingWithProfile) {
    setBookings((prev) => [...prev, newBooking]);
    setShowCreateDialog(false);
  }

  function handleBookingUpdated(updated: BookingWithProfile) {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    setSelectedBooking(null);
  }

  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MAX_VISIBLE_LANES = 3;

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
        <Button
          size="sm"
          className="rounded-lg"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Add a stay</span>
        </Button>
      </div>

      {/* List view */}
      {view === "list" && (
        <BookingListView
          homeId={homeId}
          userId={userId}
          isAdmin={isAdmin}
          members={members}
          bookings={bookings}
          onBookingUpdated={handleBookingUpdated}
        />
      )}

      {/* Calendar view */}
      {view === "calendar" && <>
      {/* Member legend */}
      {calendarBookings.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
          {members.map((m) => {
            const color = memberColorMap[m.user_id];
            return (
              <div
                key={m.user_id}
                className="flex items-center gap-1.5 text-xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: color?.hex }}
                />
                <span className="text-[var(--muted-foreground)]">
                  {m.profiles.display_name || m.profiles.email}
                </span>
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
          Drag across days to add your first stay, or use the button above.
        </div>
      )}

      {/* Calendar grid */}
      <div
        className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)] select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging.current) {
            isDragging.current = false;
            setDragStart(null);
            setDragEnd(null);
          }
        }}
      >
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
              // Height: day number row + booking lanes + optional overflow
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
                    const isInDragRange =
                      dragRange &&
                      day >= dragRange.from &&
                      day <= dragRange.to;
                    return (
                      <div
                        key={dayIdx}
                        onMouseDown={(e) => handleDayMouseDown(day, e)}
                        onMouseEnter={() => handleDayMouseEnter(day)}
                        className={cn(
                          "pt-1.5 pb-1 px-1 sm:px-2 text-right cursor-cell",
                          dayIdx > 0 && "border-l border-[var(--border)]",
                          !isCurrentMonth && "bg-[var(--muted)]/40",
                          isInDragRange && "bg-[var(--primary)]/10"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex items-center justify-center text-xs w-6 h-6 rounded-full",
                            isToday &&
                              "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold",
                            !isToday &&
                              isCurrentMonth &&
                              "text-[var(--foreground)]",
                            !isCurrentMonth && "text-[var(--muted-foreground)]"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  })}

                  {/* Booking lanes — spans full 7-col width */}
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
                        const color = memberColorMap[bar.booking.requested_by];
                        const isPending = bar.booking.status === "pending";
                        const isDeclined = bar.booking.status === "declined";
                        const leftPercent = (bar.startCol / 7) * 100;
                        const widthPercent = (bar.span / 7) * 100;
                        const displayName =
                          bar.booking.profiles.display_name || "Booking";

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
                            {bar.isStart ? displayName : ""}
                          </button>
                        );
                      })
                    )}
                    {/* Overflow indicators per day */}
                    {hasOverflow &&
                      weekDays.map((day, dayIdx) => {
                        const hiddenCount = lanes
                          .slice(MAX_VISIBLE_LANES)
                          .reduce((count, lane) => {
                            return (
                              count +
                              lane.filter((bar) => {
                                const bStart = parseISO(
                                  bar.booking.start_date
                                );
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
      </>}

      {/* Create booking dialog */}
      <CreateBookingDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setPrefillDates(null);
        }}
        homeId={homeId}
        userId={userId}
        isAdmin={isAdmin}
        members={members}
        existingBookings={bookings}
        onBookingCreated={handleBookingCreated}
        initialStartDate={prefillDates?.start}
        initialEndDate={prefillDates?.end}
      />

      {/* Booking detail sheet */}
      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          isAdmin={isAdmin}
          userId={userId}
          homeId={homeId}
          members={members}
          onClose={() => setSelectedBooking(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
}
