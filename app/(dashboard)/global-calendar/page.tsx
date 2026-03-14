import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllStaysCalendar } from "@/components/all-stays-calendar";
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

export default async function AllStaysPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get all homes the user belongs to
  const { data: memberships } = await supabase
    .from("home_members")
    .select("home_id, role, homes(id, name)")
    .eq("user_id", user.id)
    .eq("invite_status", "accepted");

  const homes = (memberships ?? []).map((m) => {
    const home = m.homes as unknown as { id: string; name: string };
    return { id: home.id, name: home.name, role: m.role };
  });

  if (homes.length === 0) redirect("/homes");

  const homeIds = homes.map((h) => h.id);

  // Fetch all bookings across all homes
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select("*, profiles(id, display_name, avatar_url)")
    .in("home_id", homeIds)
    .order("start_date", { ascending: true });

  const bookings = (rawBookings ?? []) as unknown as BookingWithProfile[];

  // Fetch all members across all homes (for detail sheet)
  const { data: rawMembers } = await supabase
    .from("home_members")
    .select("user_id, role, home_id, profiles(id, display_name, avatar_url, email)")
    .in("home_id", homeIds)
    .eq("invite_status", "accepted");

  const members = (rawMembers ?? []) as unknown as (MemberData & { home_id: string })[];

  // Check which homes the user is admin of
  const adminHomeIds = homes
    .filter((h) => h.role === "owner" || h.role === "admin")
    .map((h) => h.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Global Calendar</h1>
        <p className="text-[var(--muted-foreground)]">
          Bookings across all your homes in one view.
        </p>
      </div>
      <AllStaysCalendar
        userId={user.id}
        homes={homes}
        bookings={bookings}
        members={members}
        adminHomeIds={adminHomeIds}
      />
    </div>
  );
}
