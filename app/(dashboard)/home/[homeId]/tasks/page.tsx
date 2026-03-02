import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskList } from "@/components/task-list";
import type { Tables } from "@/lib/types/database.types";

export type TaskWithProfiles = Tables<"tasks"> & {
  assigned_profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  creator_profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  task_media: Tables<"task_media">[];
};

export type MemberOption = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default async function TasksPage({
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

  // Check membership and get role
  const { data: membership } = await supabase
    .from("home_members")
    .select("role")
    .eq("home_id", homeId)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/homes");

  // Fetch all tasks for this home
  const { data: rawTasksData } = await supabase
    .from("tasks")
    .select("*")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false });

  const rawTasks = (rawTasksData ?? []) as unknown as Tables<"tasks">[];

  // Fetch all members with profiles for assignment dropdown
  const { data: membersData } = await supabase
    .from("home_members")
    .select("user_id, profiles(id, display_name, avatar_url)")
    .eq("home_id", homeId)
    .eq("invite_status", "accepted");

  type MemberRow = { user_id: string; profiles: { id: string; display_name: string | null; avatar_url: string | null } };
  const memberRows = (membersData ?? []) as unknown as MemberRow[];

  const members: MemberOption[] = memberRows.map((m) => ({
    user_id: m.user_id,
    display_name: m.profiles.display_name,
    avatar_url: m.profiles.avatar_url,
  }));

  // Build a lookup map for profiles
  const profileMap = new Map<
    string,
    { id: string; display_name: string | null; avatar_url: string | null }
  >();
  for (const m of members) {
    profileMap.set(m.user_id, {
      id: m.user_id,
      display_name: m.display_name,
      avatar_url: m.avatar_url,
    });
  }

  // Fetch task_media for all tasks
  const taskIds = rawTasks.map((t) => t.id);
  const { data: allMediaData } = taskIds.length > 0
    ? await supabase
        .from("task_media")
        .select("*")
        .in("task_id", taskIds)
    : { data: [] };

  const allMedia = (allMediaData ?? []) as unknown as Tables<"task_media">[];

  const mediaByTask = new Map<string, Tables<"task_media">[]>();
  for (const media of allMedia) {
    const existing = mediaByTask.get(media.task_id) ?? [];
    existing.push(media);
    mediaByTask.set(media.task_id, existing);
  }

  // Combine tasks with profiles and media
  const tasks: TaskWithProfiles[] = rawTasks.map((task) => ({
    ...task,
    assigned_profile: task.assigned_to
      ? profileMap.get(task.assigned_to) ?? null
      : null,
    creator_profile: profileMap.get(task.created_by) ?? {
      id: task.created_by,
      display_name: null,
      avatar_url: null,
    },
    task_media: mediaByTask.get(task.id) ?? [],
  }));

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-[var(--muted-foreground)]">
          Keep track of things that need doing around the house.
        </p>
      </div>
      <TaskList
        homeId={homeId}
        userId={user.id}
        userRole={membership.role}
        isAdmin={isAdmin}
        initialTasks={tasks}
        members={members}
      />
    </div>
  );
}
