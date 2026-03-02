import { createClient } from "@/lib/supabase/client";

interface NotifyParams {
  type: "booking_request" | "booking_approved" | "booking_declined" | "task_assigned" | "announcement" | "comment";
  homeId: string;
  referenceType: string;
  referenceId: string;
  title: string;
  body: string;
  triggeredBy: string;
  targetUserId?: string;
}

export async function sendNotification(params: NotifyParams) {
  const supabase = createClient();

  // If specific target, insert directly (faster than edge function for single target)
  if (params.targetUserId) {
    await supabase.from("notifications").insert({
      user_id: params.targetUserId,
      home_id: params.homeId,
      type: params.type,
      title: params.title,
      body: params.body,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
    });
    return;
  }

  // For fan-out, get members and insert
  let userIds: string[] = [];

  if (params.type === "booking_request") {
    // Notify admins only
    const { data: admins } = await supabase
      .from("home_members")
      .select("user_id")
      .eq("home_id", params.homeId)
      .in("role", ["owner", "admin"])
      .eq("invite_status", "accepted");

    userIds = (admins ?? [])
      .map((a) => a.user_id)
      .filter((id) => id !== params.triggeredBy);
  } else {
    // Notify all members
    const { data: members } = await supabase
      .from("home_members")
      .select("user_id")
      .eq("home_id", params.homeId)
      .eq("invite_status", "accepted");

    userIds = (members ?? [])
      .map((m) => m.user_id)
      .filter((id) => id !== params.triggeredBy);
  }

  if (userIds.length === 0) return;

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    home_id: params.homeId,
    type: params.type,
    title: params.title,
    body: params.body,
    reference_type: params.referenceType,
    reference_id: params.referenceId,
  }));

  await supabase.from("notifications").insert(notifications);
}
