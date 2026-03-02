import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { AnnouncementFeed } from "@/components/announcement-feed";
import type { Tables } from "@/lib/types/database.types";

type ProfileData = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type CommentWithProfile = Tables<"comments"> & {
  profiles: ProfileData;
};

type AnnouncementWithComments = Tables<"announcements"> & {
  profiles: ProfileData;
  comments: CommentWithProfile[];
};

export default async function AnnouncementsPage({
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

  // Fetch announcements with author profiles
  const { data: rawAnnouncements } = await supabase
    .from("announcements")
    .select("*, profiles(id, display_name, avatar_url)")
    .eq("home_id", homeId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const announcements = (rawAnnouncements ?? []) as unknown as (Tables<"announcements"> & { profiles: ProfileData })[];

  const announcementIds = announcements.map((a) => a.id);

  // Fetch all comments
  const { data: rawComments } = announcementIds.length > 0
    ? await supabase
        .from("comments")
        .select("*, profiles(id, display_name, avatar_url)")
        .in("announcement_id", announcementIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const comments = (rawComments ?? []) as unknown as CommentWithProfile[];

  // Group comments by announcement_id
  const commentsByAnnouncement: Record<string, CommentWithProfile[]> = {};
  for (const comment of comments) {
    if (!commentsByAnnouncement[comment.announcement_id]) {
      commentsByAnnouncement[comment.announcement_id] = [];
    }
    commentsByAnnouncement[comment.announcement_id]!.push(comment);
  }

  const announcementsWithComments: AnnouncementWithComments[] = announcements.map((a) => ({
    ...a,
    comments: commentsByAnnouncement[a.id] ?? [],
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-[var(--muted-foreground)]">
          Stay in the loop with updates from the family.
        </p>
      </div>

      {announcementsWithComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-[var(--muted)] p-4 mb-4">
            <Megaphone className="h-8 w-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No announcements yet</h3>
          <p className="text-[var(--muted-foreground)] max-w-sm">
            Share something with the family! Post updates, reminders, or anything
            everyone should know about.
          </p>
        </div>
      ) : null}

      <AnnouncementFeed
        homeId={homeId}
        userId={user.id}
        isAdmin={isAdmin}
        initialAnnouncements={announcementsWithComments}
      />
    </div>
  );
}
