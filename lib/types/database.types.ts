export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      homes: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          description: string | null;
          cover_image_url: string | null;
          approval_policy: "any_admin" | "all_admins";
          max_concurrent_bookings: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          approval_policy?: "any_admin" | "all_admins";
          max_concurrent_bookings?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          approval_policy?: "any_admin" | "all_admins";
          max_concurrent_bookings?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      home_members: {
        Row: {
          id: string;
          home_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "guest";
          invite_status: "pending" | "accepted" | "declined";
          joined_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member" | "guest";
          invite_status?: "pending" | "accepted" | "declined";
          joined_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member" | "guest";
          invite_status?: "pending" | "accepted" | "declined";
          joined_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          home_id: string;
          invited_by: string;
          code: string;
          email: string | null;
          role: "admin" | "member" | "guest";
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          invited_by: string;
          code: string;
          email?: string | null;
          role?: "admin" | "member" | "guest";
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          invited_by?: string;
          code?: string;
          email?: string | null;
          role?: "admin" | "member" | "guest";
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          requested_by: string;
          start_date: string;
          end_date: string;
          guest_count?: number;
          notes?: string | null;
          status?: "pending" | "approved" | "declined" | "cancelled";
          decline_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          requested_by?: string;
          start_date?: string;
          end_date?: string;
          guest_count?: number;
          notes?: string | null;
          status?: "pending" | "approved" | "declined" | "cancelled";
          decline_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_approvals: {
        Row: {
          id: string;
          booking_id: string;
          admin_id: string;
          decision: "approved" | "declined";
          reason: string | null;
          decided_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          admin_id: string;
          decision: "approved" | "declined";
          reason?: string | null;
          decided_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          admin_id?: string;
          decision?: "approved" | "declined";
          reason?: string | null;
          decided_at?: string;
        };
        Relationships: [];
      };
      manual_categories: {
        Row: {
          id: string;
          home_id: string;
          name: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          name: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          name?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      manual_entries: {
        Row: {
          id: string;
          category_id: string;
          home_id: string;
          title: string;
          content: string;
          sort_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          home_id: string;
          title: string;
          content?: string;
          sort_order?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          home_id?: string;
          title?: string;
          content?: string;
          sort_order?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      manual_entry_media: {
        Row: {
          id: string;
          entry_id: string;
          media_type: "image" | "video";
          url: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          entry_id: string;
          media_type?: "image" | "video";
          url: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          entry_id?: string;
          media_type?: "image" | "video";
          url?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          description: string | null;
          status: "open" | "in_progress" | "done";
          assign_type: "member" | "next_visitor";
          assigned_to: string | null;
          created_by: string;
          due_date: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          title: string;
          description?: string | null;
          status?: "open" | "in_progress" | "done";
          assign_type?: "member" | "next_visitor";
          assigned_to?: string | null;
          created_by: string;
          due_date?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          title?: string;
          description?: string | null;
          status?: "open" | "in_progress" | "done";
          assign_type?: "member" | "next_visitor";
          assigned_to?: string | null;
          created_by?: string;
          due_date?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_media: {
        Row: {
          id: string;
          task_id: string;
          media_type: "image";
          url: string;
          label: "proof" | "reference";
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          media_type?: "image";
          url: string;
          label?: "proof" | "reference";
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          media_type?: "image";
          url?: string;
          label?: "proof" | "reference";
          created_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          home_id: string;
          author_id: string;
          title: string;
          body: string;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          home_id: string;
          author_id: string;
          title: string;
          body: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          home_id?: string;
          author_id?: string;
          title?: string;
          body?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          announcement_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          announcement_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          announcement_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          home_id: string;
          type: "booking_request" | "booking_approved" | "booking_declined" | "task_assigned" | "announcement" | "comment";
          title: string;
          body: string;
          reference_type: string | null;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          home_id: string;
          type: "booking_request" | "booking_approved" | "booking_declined" | "task_assigned" | "announcement" | "comment";
          title: string;
          body: string;
          reference_type?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          home_id?: string;
          type?: "booking_request" | "booking_approved" | "booking_declined" | "task_assigned" | "announcement" | "comment";
          title?: string;
          body?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      approval_policy: "any_admin" | "all_admins";
      booking_status: "pending" | "approved" | "declined" | "cancelled";
      home_role: "owner" | "admin" | "member" | "guest";
      invite_role: "admin" | "member" | "guest";
      invite_status: "pending" | "accepted" | "declined";
      task_status: "open" | "in_progress" | "done";
      assign_type: "member" | "next_visitor";
      notification_type: "booking_request" | "booking_approved" | "booking_declined" | "task_assigned" | "announcement" | "comment";
      approval_decision: "approved" | "declined";
      media_type: "image" | "video";
      task_media_label: "proof" | "reference";
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
