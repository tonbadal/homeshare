import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AllMembersPage } from "@/components/all-members-page";

export default async function AllMembersRoute() {
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

  // Fetch all members across those homes
  const { data: rawMembers } = await supabase
    .from("home_members")
    .select("id, home_id, user_id, role, profiles(id, email, display_name, avatar_url)")
    .in("home_id", homeIds)
    .eq("invite_status", "accepted");

  type RawMember = {
    id: string;
    home_id: string;
    user_id: string;
    role: string;
    profiles: {
      id: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  };

  const allMembers = (rawMembers ?? []) as unknown as RawMember[];

  // Determine which homes the current user is admin/owner of
  const adminHomeIds = homes
    .filter((h) => h.role === "owner" || h.role === "admin")
    .map((h) => h.id);

  // Filter to admin homes for the invite button
  const adminHomes = homes.filter((h) => adminHomeIds.includes(h.id));

  return (
    <AllMembersPage
      userId={user.id}
      homes={homes}
      allMembers={allMembers}
      adminHomeIds={adminHomeIds}
      adminHomes={adminHomes}
    />
  );
}
