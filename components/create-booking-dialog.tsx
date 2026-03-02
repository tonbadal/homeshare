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
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parseISO, isWithinInterval, isBefore, format } from "date-fns";
import type { Tables } from "@/lib/types/database.types";

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
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  homeId,
  userId,
  existingBookings,
  onBookingCreated,
}: CreateBookingDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        guest_count: guestCount,
        notes: notes || null,
      })
      .select("*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)")
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
    setStartDate("");
    setEndDate("");
    setGuestCount(1);
    setNotes("");
    setLoading(false);
  }

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Arrival</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Departure</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-count">Number of guests</Label>
            <Input
              id="guest-count"
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
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
                    {c.profiles.display_name || "Someone"}: {format(parseISO(c.start_date), "MMM d")} – {format(parseISO(c.end_date), "MMM d")} ({c.status})
                  </p>
                ))}
                <p className="text-xs mt-1 opacity-75">
                  You can still submit — the admin will decide.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
