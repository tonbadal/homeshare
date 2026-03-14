import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserSettings } from "@/components/user-settings";

export default async function AccountPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-[var(--muted-foreground)]">
          Manage your personal information and security.
        </p>
      </div>
      <UserSettings
        profile={profile}
        homeId={homeId}
        userEmail={user.email ?? profile.email}
      />
    </div>
  );
}
