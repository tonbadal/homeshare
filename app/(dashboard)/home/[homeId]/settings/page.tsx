import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeSettings } from "@/components/home-settings";
import type { Tables } from "@/lib/types/database.types";

export default async function SettingsPage({
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

  const { data: rawHome } = await supabase
    .from("homes")
    .select("*")
    .eq("id", homeId)
    .single();

  const home = rawHome as unknown as Tables<"homes"> | null;
  if (!home) redirect("/homes");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)]">Manage your home settings.</p>
      </div>
      <HomeSettings
        home={home}
        isAdmin={isAdmin}
        homeId={homeId}
      />
    </div>
  );
}
