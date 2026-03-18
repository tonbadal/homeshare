"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin } from "lucide-react";

type HomeData = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  cover_image_url: string | null;
  role: string;
};

type MemberRow = {
  home_id: string;
  user_id: string;
  profiles: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

interface HomeCardGridProps {
  homes: HomeData[];
  membersByHome: Record<string, MemberRow[]>;
}

function getInitials(name: string | null, email: string): string {
  return (name || email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function HomeCardGrid({ homes, membersByHome }: HomeCardGridProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:grid-cols-2">
        {homes.map((home) => {
          const members = membersByHome[home.id] ?? [];
          const visibleMembers = members.slice(0, 5);
          const overflow = members.length - 5;

          return (
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
                {(home.description || members.length > 0) && (
                  <CardContent>
                    {home.description && (
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
                        {home.description}
                      </p>
                    )}
                    {members.length > 0 && (
                      <div className="flex items-center -space-x-2">
                        {visibleMembers.map((member) => {
                          const initials = getInitials(
                            member.profiles.display_name,
                            member.profiles.email
                          );
                          return (
                            <Tooltip key={member.user_id}>
                              <TooltipTrigger asChild>
                                <Avatar className="h-7 w-7 border-2 border-[var(--card)]">
                                  <AvatarFallback className="text-[10px]">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                {member.profiles.display_name || member.profiles.email}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {overflow > 0 && (
                          <div className="h-7 w-7 rounded-full border-2 border-[var(--card)] bg-[var(--muted)] flex items-center justify-center">
                            <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                              +{overflow}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
