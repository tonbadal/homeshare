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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parseISO, isBefore, format } from "date-fns";
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

interface EditBookingDialogProps {
  booking: BookingWithProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  userId: string;
  members: MemberData[];
  onBookingUpdated: (booking: BookingWithProfile) => void;
}

export function EditBookingDialog({
  booking,
  open,
  onOpenChange,
  isAdmin,
  userId,
  members,
  onBookingUpdated,
}: EditBookingDialogProps) {
  const isSmUp = useMediaQuery("(min-width: 640px)");
  const [selectedMember, setSelectedMember] = useState(booking.requested_by);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parseISO(booking.start_date),
    to: parseISO(booking.end_date),
  });
  const [guestCount, setGuestCount] = useState(String(booking.guest_count));
  const [notes, setNotes] = useState(booking.notes || "");
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  // Reset form when booking changes
  useEffect(() => {
    if (open) {
      setSelectedMember(booking.requested_by);
      setDateRange({
        from: parseISO(booking.start_date),
        to: parseISO(booking.end_date),
      });
      setGuestCount(String(booking.guest_count));
      setNotes(booking.notes || "");
    }
  }, [open, booking]);

  const startDate = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

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
      .update({
        requested_by: isAdmin ? selectedMember : booking.requested_by,
        start_date: startDate,
        end_date: endDate,
        guest_count: parseInt(guestCount) || 1,
        notes: notes || null,
      })
      .eq("id", booking.id)
      .select(
        "*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)"
      )
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update stay.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({ title: "Stay updated!" });
    onBookingUpdated(data as BookingWithProfile);
    onOpenChange(false);
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
          <DialogTitle>Edit stay</DialogTitle>
          <DialogDescription>
            Update the details of this stay.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member picker — admins only */}
          {isAdmin && members.length > 1 && (
            <div className="space-y-2">
              <Label>Who is staying</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles.display_name || m.profiles.email}
                      {m.user_id === userId ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label htmlFor="edit-guest-count">Number of guests</Label>
            <Input
              id="edit-guest-count"
              type="number"
              min={1}
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Textarea
              id="edit-notes"
              placeholder="Any details about the visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

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
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
