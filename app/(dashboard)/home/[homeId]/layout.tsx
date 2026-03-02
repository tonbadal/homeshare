import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import type { HomeWithRole } from "@/lib/types";

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Get all homes the user belongs to
  const { data: memberships } = await supabase
    .from("home_members")
    .select("role, homes(id, name, address, description, cover_image_url)")
    .eq("user_id", user.id)
    .eq("invite_status", "accepted");

  const homes: HomeWithRole[] = (memberships ?? []).map((m) => {
    const home = m.homes as unknown as {
      id: string;
      name: string;
      address: string | null;
      description: string | null;
      cover_image_url: string | null;
    };
    return {
      ...home,
      role: m.role,
    };
  });

  const currentHome = homes.find((h) => h.id === homeId);

  if (!currentHome) {
    redirect("/homes");
  }

  // Get unread notifications count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("home_id", homeId)
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        homeId={homeId}
        homes={homes}
        currentHome={currentHome}
        user={profile}
        unreadCount={unreadCount ?? 0}
      />
      <main className="flex-1 lg:overflow-y-auto pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
