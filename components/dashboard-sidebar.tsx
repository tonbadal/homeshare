"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Calendar,
  CalendarRange,
  BookOpen,
  CheckSquare,
  MessageSquare,
  Settings,
  Home,
  ChevronDown,
  LogOut,
  Menu,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import type { HomeWithRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Calendar", href: "calendar", icon: Calendar },
  { label: "House Manual", href: "manual", icon: BookOpen },
  { label: "Tasks", href: "tasks", icon: CheckSquare },
  { label: "Announcements", href: "announcements", icon: MessageSquare },
  { label: "Members", href: "members", icon: Users },
  { label: "Settings", href: "settings", icon: Settings },
];

interface DashboardSidebarProps {
  homeId: string;
  homes: HomeWithRole[];
  currentHome: HomeWithRole;
  user: { id: string; email: string; display_name: string | null };
}

export function DashboardSidebar({
  homeId,
  homes,
  currentHome,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showHomeSwitcher, setShowHomeSwitcher] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = (user.display_name || user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Home Switcher */}
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <button
          onClick={() => setShowHomeSwitcher(!showHomeSwitcher)}
          className="flex items-center gap-2 w-full text-left hover:bg-[var(--sidebar-accent)] rounded-md p-2 transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">
            <Home className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentHome.name}</p>
            <p className="text-xs text-[var(--muted-foreground)] capitalize">{currentHome.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
        {showHomeSwitcher && (
          <div className="mt-2 space-y-1">
            {homes.map((home) => (
              <Link
                key={home.id}
                href={`/home/${home.id}/calendar`}
                onClick={() => {
                  setShowHomeSwitcher(false);
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-sm transition-colors",
                  home.id === homeId
                    ? "bg-[var(--sidebar-accent)] font-medium"
                    : "hover:bg-[var(--sidebar-accent)]"
                )}
              >
                <Home className="h-4 w-4" />
                <span className="truncate">{home.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Overview links */}
      <div className="px-3 pt-3 pb-1 space-y-1">
        <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-widest px-3 mb-1">
          Overview
        </p>
        <Link
          href="/global-calendar"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith("/global-calendar")
              ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-medium"
              : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
          )}
        >
          <CalendarRange className="h-4 w-4" />
          Global Calendar
        </Link>
        <Link
          href="/homes"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/homes"
              ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-medium"
              : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
          )}
        >
          <Home className="h-4 w-4" />
          All Homes
        </Link>
        <Link
          href="/all-members"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith("/all-members")
              ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-medium"
              : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
          )}
        >
          <Users className="h-4 w-4" />
          All Members
        </Link>
      </div>

      <div className="mx-3 border-t border-[var(--sidebar-border)]" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const href = `/home/${homeId}/${item.href}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={item.href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-medium"
                  : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom - Notifications + User */}
      <div className="p-3 border-t border-[var(--sidebar-border)] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <Link
            href={`/home/${homeId}/account`}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 flex-1 min-w-0 rounded-md hover:bg-[var(--sidebar-accent)] transition-colors -m-1 p-1"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.display_name || user.email}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Account settings</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 shrink-0" title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold">{currentHome.name}</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--sidebar-background)] overflow-y-auto">
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-[var(--sidebar-border)] lg:bg-[var(--sidebar-background)] lg:h-screen lg:sticky lg:top-0">
        {sidebar}
      </aside>
    </>
  );
}
