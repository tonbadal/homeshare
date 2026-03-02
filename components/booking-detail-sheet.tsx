"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Users, Clock, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import type { Tables } from "@/lib/types/database.types";

type BookingWithProfile = Tables<"bookings"> & {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

interface BookingDetailSheetProps {
  booking: BookingWithProfile;
  isAdmin: boolean;
  userId: string;
  homeId: string;
  onClose: () => void;
  onUpdated: (booking: BookingWithProfile) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  declined: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

export function BookingDetailSheet({
  booking,
  isAdmin,
  userId,
  homeId,
  onClose,
  onUpdated,
}: BookingDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const { toast } = useToast();

  async function handleApprove() {
    setLoading(true);
    const supabase = createClient();

    const { error: approvalError } = await supabase.from("booking_approvals").insert({
      booking_id: booking.id,
      admin_id: userId,
      decision: "approved",
    });

    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "approved" })
      .eq("id", booking.id)
      .select("*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)")
      .single();

    if (error || approvalError) {
      toast({ title: "Error", description: "Failed to approve booking.", variant: "destructive" });
    } else {
      toast({ title: "Booking approved!" });
      onUpdated(data as BookingWithProfile);
    }
    setLoading(false);
  }

  async function handleDecline() {
    setLoading(true);
    const supabase = createClient();

    const { error: approvalError } = await supabase.from("booking_approvals").insert({
      booking_id: booking.id,
      admin_id: userId,
      decision: "declined",
      reason: reason || null,
    });

    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "declined", decline_reason: reason || null })
      .eq("id", booking.id)
      .select("*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)")
      .single();

    if (error || approvalError) {
      toast({ title: "Error", description: "Failed to decline booking.", variant: "destructive" });
    } else {
      toast({ title: "Booking declined." });
      onUpdated(data as BookingWithProfile);
    }
    setLoading(false);
  }

  async function handleCancel() {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id)
      .select("*, profiles!bookings_requested_by_fkey(id, display_name, avatar_url)")
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" });
    } else {
      toast({ title: "Booking cancelled." });
      onUpdated(data as BookingWithProfile);
    }
    setLoading(false);
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Booking by {booking.profiles.display_name || "Unknown"}
            <Badge className={statusColors[booking.status]} variant="outline">
              {booking.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
              <div>
                <p className="font-medium">
                  {format(parseISO(booking.start_date), "MMM d, yyyy")}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">Arrival</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
              <div>
                <p className="font-medium">
                  {format(parseISO(booking.end_date), "MMM d, yyyy")}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">Departure</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>{booking.guest_count} guest{booking.guest_count !== 1 ? "s" : ""}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>Requested {format(parseISO(booking.created_at), "MMM d, yyyy 'at' HH:mm")}</span>
          </div>

          {booking.notes && (
            <div className="text-sm">
              <p className="font-medium mb-1">Notes</p>
              <p className="text-[var(--muted-foreground)]">{booking.notes}</p>
            </div>
          )}

          {booking.decline_reason && (
            <div className="text-sm p-3 rounded-md bg-red-50 border border-red-200">
              <p className="font-medium text-red-800 mb-1">Decline reason</p>
              <p className="text-red-700">{booking.decline_reason}</p>
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && booking.status === "pending" && (
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              {showDeclineForm ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for declining (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDecline}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading && <Loader2 className="animate-spin" />}
                      Confirm decline
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(false)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeclineForm(true)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Owner can cancel */}
          {booking.requested_by === userId &&
            (booking.status === "pending" || booking.status === "approved") && (
              <div className="pt-2 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="animate-spin" />}
                  Cancel my booking
                </Button>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
