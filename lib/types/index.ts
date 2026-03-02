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
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-800", hex: "#3b82f6" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-800", hex: "#22c55e" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-800", hex: "#a855f7" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-800", hex: "#f97316" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-800", hex: "#ec4899" },
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-800", hex: "#14b8a6" },
  { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-800", hex: "#f59e0b" },
  { bg: "bg-cyan-100", border: "border-cyan-400", text: "text-cyan-800", hex: "#06b6d4" },
];
