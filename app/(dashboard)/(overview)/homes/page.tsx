import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";
import { CreateHomeDialog } from "@/components/create-home-dialog";
import { HomeCardGrid } from "@/components/home-card-grid";

export default async function HomesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("home_members")
    .select("role, homes(id, name, address, description, cover_image_url)")
    .eq("user_id", user.id)
    .eq("invite_status", "accepted");

  const homes = (memberships ?? []).map((m) => {
    const home = m.homes as unknown as {
      id: string;
      name: string;
      address: string | null;
      description: string | null;
      cover_image_url: string | null;
    };
    return { ...home, role: m.role };
  });

  // Fetch all members across user's homes
  const homeIds = homes.map((h) => h.id);
  const { data: rawMembers } = homeIds.length > 0
    ? await supabase
        .from("home_members")
        .select("home_id, user_id, profiles(id, display_name, email, avatar_url)")
        .in("home_id", homeIds)
        .eq("invite_status", "accepted")
    : { data: [] };

  type MemberRow = {
    home_id: string;
    user_id: string;
    profiles: {
      id: string;
      display_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  };

  const members = (rawMembers ?? []) as unknown as MemberRow[];

  // Group members by home_id
  const membersByHome: Record<string, MemberRow[]> = {};
  for (const m of members) {
    if (!membersByHome[m.home_id]) membersByHome[m.home_id] = [];
    membersByHome[m.home_id].push(m);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Homes</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Choose a home to manage, or create a new one.
          </p>
        </div>
        <CreateHomeDialog userId={user.id} />
      </div>

      {homes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-[var(--muted-foreground)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No homes yet</h2>
            <p className="text-[var(--muted-foreground)] max-w-sm mb-6">
              Create your first shared home or ask a family member to send you an invite link.
            </p>
            <CreateHomeDialog userId={user.id} />
          </CardContent>
        </Card>
      ) : (
        <HomeCardGrid homes={homes} membersByHome={membersByHome} />
      )}
    </div>
  );
}
