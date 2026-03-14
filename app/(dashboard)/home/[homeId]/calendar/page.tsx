import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingCalendar } from "@/components/booking-calendar";
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

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("home_members")
    .select("role")
    .eq("home_id", homeId)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/homes");

  // Get all members with profiles for color mapping
  const { data: rawMembers } = await supabase
    .from("home_members")
    .select("user_id, role, profiles(id, display_name, avatar_url, email)")
    .eq("home_id", homeId)
    .eq("invite_status", "accepted");

  const members = (rawMembers ?? []) as unknown as MemberData[];

  // Get all bookings (including cancelled/declined for list view)
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select("*, profiles(id, display_name, avatar_url)")
    .eq("home_id", homeId)
    .order("start_date", { ascending: true });

  const bookings = (rawBookings ?? []) as unknown as BookingWithProfile[];

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-[var(--muted-foreground)]">
          View and manage bookings for your shared home.
        </p>
      </div>
      <BookingCalendar
        homeId={homeId}
        userId={user.id}
        isAdmin={isAdmin}
        members={members}
        initialBookings={bookings}
      />
    </div>
  );
}
