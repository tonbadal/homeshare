import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyPayload {
  type:
    | "booking_request"
    | "booking_approved"
    | "booking_declined"
    | "task_assigned"
    | "announcement"
    | "comment";
  home_id: string;
  reference_type: string;
  reference_id: string;
  title: string;
  body: string;
  // Who triggered the event (exclude from recipients)
  triggered_by: string;
  // Specific user to notify (for targeted notifications)
  target_user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: NotifyPayload = await req.json();

    let userIds: string[] = [];

    if (payload.target_user_id) {
      // Targeted notification (e.g., booking approved → notify requester)
      userIds = [payload.target_user_id];
    } else if (
      payload.type === "booking_request"
    ) {
      // Notify admins/owners of the home
      const { data: admins } = await supabase
        .from("home_members")
        .select("user_id")
        .eq("home_id", payload.home_id)
        .in("role", ["owner", "admin"])
        .eq("invite_status", "accepted");

      userIds = (admins ?? [])
        .map((a: { user_id: string }) => a.user_id)
        .filter((id: string) => id !== payload.triggered_by);
    } else {
      // Notify all members of the home (except trigger)
      const { data: members } = await supabase
        .from("home_members")
        .select("user_id")
        .eq("home_id", payload.home_id)
        .eq("invite_status", "accepted");

      userIds = (members ?? [])
        .map((m: { user_id: string }) => m.user_id)
        .filter((id: string) => id !== payload.triggered_by);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert notifications for all recipients
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      home_id: payload.home_id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      reference_type: payload.reference_type,
      reference_id: payload.reference_id,
      is_read: false,
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ sent: notifications.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
