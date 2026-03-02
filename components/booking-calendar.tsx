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
  isWithinInterval,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MEMBER_COLORS } from "@/lib/types";
import { CreateBookingDialog } from "@/components/create-booking-dialog";
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

interface BookingCalendarProps {
  homeId: string;
  userId: string;
  isAdmin: boolean;
  members: MemberData[];
  initialBookings: BookingWithProfile[];
}

export function BookingCalendar({
  homeId,
  userId,
  isAdmin,
  members,
  initialBookings,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Assign colors to members
  const memberColorMap = useMemo(() => {
    const map: Record<string, (typeof MEMBER_COLORS)[0]> = {};
    members.forEach((m, i) => {
      map[m.user_id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
    });
    return map;
  }, [members]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getBookingsForDay(day: Date) {
    return bookings.filter((b) => {
      const start = parseISO(b.start_date);
      const end = parseISO(b.end_date);
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
    });
  }

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

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold min-w-[110px] sm:min-w-[180px] text-center">
            {format(currentMonth, "MMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Book a stay</span>
        </Button>
      </div>

      {/* Member legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center w-full">
            <CalendarDays className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)]">
              No bookings yet — be the first to plan a trip!
            </p>
          </div>
        ) : (
          <>
            {members.map((m) => {
              const color = memberColorMap[m.user_id];
              return (
                <div key={m.user_id} className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn("w-3 h-3 rounded-full", color?.bg, "border", color?.border)}
                  />
                  <span>{m.profiles.display_name || m.profiles.email}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <span className="w-3 h-3 rounded-full bg-gray-200 border border-dashed border-gray-400" />
              Pending
            </div>
          </>
        )}
      </div>

      {/* Calendar grid */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-[var(--muted)]">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-[var(--muted-foreground)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[80px] lg:min-h-[100px] p-1 border-t border-l border-[var(--border)] first:border-l-0",
                  !isCurrentMonth && "bg-[var(--muted)]/30",
                  idx % 7 === 0 && "border-l-0"
                )}
              >
                <div
                  className={cn(
                    "text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    isToday && "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold",
                    !isCurrentMonth && "text-[var(--muted-foreground)]"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map((booking) => {
                    const color = memberColorMap[booking.requested_by];
                    const isPending = booking.status === "pending";
                    const isStart = isSameDay(day, parseISO(booking.start_date));

                    return (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className={cn(
                          "w-full text-left text-[10px] lg:text-xs px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-80",
                          isPending
                            ? "bg-gray-100 border border-dashed border-gray-300 text-gray-600"
                            : cn(color?.bg, "border", color?.border, color?.text)
                        )}
                      >
                        {isStart
                          ? booking.profiles.display_name || "Booking"
                          : ""}
                      </button>
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <span className="text-[10px] text-[var(--muted-foreground)] px-1">
                      +{dayBookings.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create booking dialog */}
      <CreateBookingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        homeId={homeId}
        userId={userId}
        existingBookings={bookings}
        onBookingCreated={handleBookingCreated}
      />

      {/* Booking detail sheet */}
      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          isAdmin={isAdmin}
          userId={userId}
          homeId={homeId}
          onClose={() => setSelectedBooking(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
}
