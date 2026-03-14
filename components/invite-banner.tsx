"use client";

import { UserPlus } from "lucide-react";
import { InviteDialog } from "@/components/invite-dialog";

interface InviteBannerProps {
  homeId: string;
  userId: string;
}

export function InviteBanner({ homeId, userId }: InviteBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6 px-4 py-3 rounded-lg border border-dashed border-[var(--primary)]/30 bg-[var(--primary)]/5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 shrink-0">
          <UserPlus className="h-4 w-4 text-[var(--primary)]" />
        </div>
        <p className="text-sm text-[var(--foreground)]">
          <span className="font-medium">You&apos;re the only one here!</span>{" "}
          <span className="text-[var(--muted-foreground)]">
            Invite family members so they can book stays and collaborate.
          </span>
        </p>
      </div>
      <InviteDialog
        homeId={homeId}
        userId={userId}
        trigger={
          <button className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        }
      />
    </div>
  );
}
