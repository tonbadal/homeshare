export type { Database, Tables, InsertTables, UpdateTables, Enums } from "./database.types";

export type HomeWithRole = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  cover_image_url: string | null;
  role: "owner" | "admin" | "member" | "guest";
};

export type MemberWithProfile = {
  id: string;
  home_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "guest";
  invite_status: "pending" | "accepted" | "declined";
  joined_at: string;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type BookingWithProfile = {
  id: string;
  home_id: string;
  requested_by: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  notes: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  decline_reason: string | null;
  created_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

// Member colours for calendar
export const MEMBER_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-white", hex: "#3b82f6" },
  { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-white", hex: "#10b981" },
  { bg: "bg-violet-500", border: "border-violet-600", text: "text-white", hex: "#8b5cf6" },
  { bg: "bg-orange-500", border: "border-orange-600", text: "text-white", hex: "#f97316" },
  { bg: "bg-rose-500", border: "border-rose-600", text: "text-white", hex: "#f43f5e" },
  { bg: "bg-teal-500", border: "border-teal-600", text: "text-white", hex: "#14b8a6" },
  { bg: "bg-amber-500", border: "border-amber-600", text: "text-white", hex: "#f59e0b" },
  { bg: "bg-cyan-500", border: "border-cyan-600", text: "text-white", hex: "#06b6d4" },
];
