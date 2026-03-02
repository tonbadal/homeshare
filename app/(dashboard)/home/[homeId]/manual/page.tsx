import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManualContent } from "@/components/manual-content";
import { BookOpen } from "lucide-react";
import type { Tables } from "@/lib/types/database.types";

type EntryWithMedia = Tables<"manual_entries"> & {
  manual_entry_media: Tables<"manual_entry_media">[];
};

export default async function ManualPage({
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

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  // Fetch categories ordered by sort_order
  const { data: categories } = await supabase
    .from("manual_categories")
    .select("*")
    .eq("home_id", homeId)
    .order("sort_order", { ascending: true });

  // Fetch all entries with their media for this home
  const { data: entries } = await supabase
    .from("manual_entries")
    .select("*, manual_entry_media(*)")
    .eq("home_id", homeId)
    .order("sort_order", { ascending: true });

  const safeCategories = (categories ?? []) as unknown as Tables<"manual_categories">[];
  const safeEntries = (entries ?? []) as unknown as EntryWithMedia[];

  if (safeCategories.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">House Manual</h1>
          <p className="text-[var(--muted-foreground)]">
            Instructions, guides, and important info about the house.
          </p>
        </div>

        {isAdmin ? (
          <ManualContent
            homeId={homeId}
            userId={user.id}
            isAdmin={isAdmin}
            initialCategories={safeCategories}
            initialEntries={safeEntries}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-[var(--muted)] p-4 mb-4">
              <BookOpen className="h-8 w-8 text-[var(--muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No manual entries yet</h2>
            <p className="text-[var(--muted-foreground)] max-w-sm">
              No manual entries yet — add your first house instruction! Ask an
              admin to add some helpful info about the house.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">House Manual</h1>
        <p className="text-[var(--muted-foreground)]">
          Instructions, guides, and important info about the house.
        </p>
      </div>

      <ManualContent
        homeId={homeId}
        userId={user.id}
        isAdmin={isAdmin}
        initialCategories={safeCategories}
        initialEntries={safeEntries}
      />
    </div>
  );
}
