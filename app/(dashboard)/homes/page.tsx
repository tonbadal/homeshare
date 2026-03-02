import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Plus, MapPin } from "lucide-react";
import { CreateHomeDialog } from "@/components/create-home-dialog";

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

  // If user has exactly one home, redirect directly to it
  if (homes.length === 1) {
    redirect(`/home/${homes[0].id}/calendar`);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Homes</h1>
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
          <div className="grid gap-4 sm:grid-cols-2">
            {homes.map((home) => (
              <Link key={home.id} href={`/home/${home.id}/calendar`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  {home.cover_image_url && (
                    <div className="h-32 bg-[var(--muted)] rounded-t-lg overflow-hidden">
                      <img
                        src={home.cover_image_url}
                        alt={home.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{home.name}</CardTitle>
                        {home.address && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {home.address}
                          </CardDescription>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] capitalize">
                        {home.role}
                      </span>
                    </div>
                  </CardHeader>
                  {home.description && (
                    <CardContent>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {home.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
