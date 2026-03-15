"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, AlertTriangle, CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  parseISO,
  isWithinInterval,
  isBefore,
  format,
} from "date-fns";
import { cn } from "@/lib/utils/cn";
import type { Tables } from "@/lib/types/database.types";
import type { DateRange } from "react-day-picker";

function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type BookingWithProfile = Tables<"bookings"> & {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
  userId: string;
  existingBookings: BookingWithProfile[];
  onBookingCreated: (booking: BookingWithProfile) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  homeId,
  userId,
  existingBookings,
  onBookingCreated,
  initialStartDate,
  initialEndDate,
}: CreateBookingDialogProps) {
  const isSmUp = useMediaQuery("(min-width: 640px)");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [guestCount, setGuestCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  // Sync prefilled dates when dialog opens
  useEffect(() => {
    if (open) {
      const from = initialStartDate ? parseISO(initialStartDate) : undefined;
      const to = initialEndDate ? parseISO(initialEndDate) : undefined;
      setDateRange(from ? { from, to } : undefined);
    }
  }, [open, initialStartDate, initialEndDate]);

  const startDate = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  // Check for conflicts
  const conflicts = existingBookings.filter((b) => {
    if (b.status === "declined" || b.status === "cancelled") return false;
    if (!startDate || !endDate) return false;
    const bStart = parseISO(b.start_date);
    const bEnd = parseISO(b.end_date);
    const newStart = parseISO(startDate);
    const newEnd = parseISO(endDate);
    return (
      isWithinInterval(newStart, { start: bStart, end: bEnd }) ||
      isWithinInterval(newEnd, { start: bStart, end: bEnd }) ||
      isWithinInterval(bStart, { start: newStart, end: newEnd })
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Please select both arrival and departure dates.",
        variant: "destructive",
      });
      return;
    }
    if (isBefore(parseISO(endDate), parseISO(startDate))) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        home_id: homeId,
        requested_by: userId,
        start_date: startDate,
        end_date: endDate,
        guest_count: parseInt(guestCount) || 1,
        notes: notes || null,
      })
      .select(
        "*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)"
      )
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit booking request.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Booking submitted!",
      description: "Your request is pending admin approval.",
    });

    onBookingCreated(data as BookingWithProfile);
    setDateRange(undefined);
    setGuestCount("1");
    setNotes("");
    setLoading(false);
  }

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a stay</DialogTitle>
          <DialogDescription>
            Submit a booking request. An admin will review and approve it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Dates</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateLabel && "text-[var(--muted-foreground)]"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateLabel ?? "Select arrival & departure"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={isSmUp ? 2 : 1}
                  defaultMonth={dateRange?.from}
                />
                <div className="border-t border-[var(--border)] p-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-count">Number of guests</Label>
            <Input
              id="guest-count"
              type="number"
              min={1}
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any details about your visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {conflicts.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Overlapping bookings detected</p>
                {conflicts.map((c) => (
                  <p key={c.id} className="text-xs mt-1">
                    {c.profiles.display_name || "Someone"}:{" "}
                    {format(parseISO(c.start_date), "MMM d")} –{" "}
                    {format(parseISO(c.end_date), "MMM d")} ({c.status})
                  </p>
                ))}
                <p className="text-xs mt-1 opacity-75">
                  You can still submit — the admin will decide.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !startDate || !endDate}>
              {loading && <Loader2 className="animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
