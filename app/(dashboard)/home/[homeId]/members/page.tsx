import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembersPage } from "@/components/members-page";
import type { Tables } from "@/lib/types/database.types";

type MemberWithProfile = Tables<"home_members"> & {
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type InviteWithProfile = Tables<"invites"> & {
  profiles: { display_name: string | null };
};

export default async function MembersRoute({
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

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const { data: rawMembers } = await supabase
    .from("home_members")
    .select("*, profiles(id, email, display_name, avatar_url)")
    .eq("home_id", homeId)
    .eq("invite_status", "accepted")
    .order("joined_at", { ascending: true });

  const members = (rawMembers ?? []) as unknown as MemberWithProfile[];

  // Fetch ALL invites for this home (not just active ones)
  const { data: rawInvites } = await supabase
    .from("invites")
    .select("*, profiles!invites_invited_by_fkey(display_name)")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false });

  const invites = (rawInvites ?? []) as unknown as InviteWithProfile[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-[var(--muted-foreground)]">
          Manage members and invite links for your home.
        </p>
      </div>
      <MembersPage
        members={members}
        invites={invites}
        isAdmin={isAdmin}
        userId={user.id}
        homeId={homeId}
      />
    </div>
  );
}
