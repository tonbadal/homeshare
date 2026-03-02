import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notification-list";
import type { Tables } from "@/lib/types/database.types";

export default async function NotificationsPage({
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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-[var(--muted-foreground)]">Stay up to date with what&apos;s happening.</p>
      </div>
      <NotificationList
        notifications={(notifications ?? []) as unknown as Tables<"notifications">[]}
        homeId={homeId}
        userId={user.id}
      />
    </div>
  );
}
