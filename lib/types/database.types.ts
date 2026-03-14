Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          home_id: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          home_id: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          home_id?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_approvals: {
        Row: {
          admin_id: string
          booking_id: string
          decided_at: string
          decision: Database["public"]["Enums"]["approval_decision"]
          id: string
          reason: string | null
        }
        Insert: {
          admin_id: string
          booking_id: string
          decided_at?: string
          decision: Database["public"]["Enums"]["approval_decision"]
          id?: string
          reason?: string | null
        }
        Update: {
          admin_id?: string
          booking_id?: string
          decided_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_approvals_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approvals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          decline_reason: string | null
          end_date: string
          guest_count: number
          home_id: string
          id: string
          notes: string | null
          requested_by: string
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          end_date: string
          guest_count?: number
          home_id: string
          id?: string
          notes?: string | null
          requested_by: string
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          end_date?: string
          guest_count?: number
          home_id?: string
          id?: string
          notes?: string | null
          requested_by?: string
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          announcement_id: string
          author_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          announcement_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          announcement_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_members: {
        Row: {
          home_id: string
          id: string
          invite_status: Database["public"]["Enums"]["invite_status_enum"]
          joined_at: string
          role: Database["public"]["Enums"]["home_role"]
          user_id: string
        }
        Insert: {
          home_id: string
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status_enum"]
          joined_at?: string
          role?: Database["public"]["Enums"]["home_role"]
          user_id: string
        }
        Update: {
          home_id?: string
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status_enum"]
          joined_at?: string
          role?: Database["public"]["Enums"]["home_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_members_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          address: string | null
          approval_policy: Database["public"]["Enums"]["approval_policy"]
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          max_concurrent_bookings: number
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          approval_policy?: Database["public"]["Enums"]["approval_policy"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_concurrent_bookings?: number
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          approval_policy?: Database["public"]["Enums"]["approval_policy"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_concurrent_bookings?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          email: string | null
          expires_at: string | null
          home_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["invite_role"]
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          home_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["invite_role"]
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          home_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["invite_role"]
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invites_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_categories: {
        Row: {
          created_at: string
          home_id: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          home_id: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          home_id?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_categories_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_entries: {
        Row: {
          category_id: string
          content: string
          created_at: string
          created_by: string | null
          home_id: string
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content?: string
          created_at?: string
          created_by?: string | null
          home_id: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          home_id?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "manual_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_entries_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_entry_media: {
        Row: {
          entry_id: string
          id: string
          media_type: Database["public"]["Enums"]["media_type_enum"]
          sort_order: number
          url: string
        }
        Insert: {
          entry_id: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type_enum"]
          sort_order?: number
          url: string
        }
        Update: {
          entry_id?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type_enum"]
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_entry_media_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "manual_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          home_id: string
          id: string
          is_read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          home_id: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          home_id?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_media: {
        Row: {
          created_at: string
          id: string
          label: Database["public"]["Enums"]["task_media_label"]
          media_type: string
          task_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: Database["public"]["Enums"]["task_media_label"]
          media_type?: string
          task_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: Database["public"]["Enums"]["task_media_label"]
          media_type?: string
          task_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_media_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assign_type: Database["public"]["Enums"]["assign_type"]
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          home_id: string
          id: string
          is_recurring: boolean
          recurrence_rule: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assign_type?: Database["public"]["Enums"]["assign_type"]
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          home_id: string
          id?: string
          is_recurring?: boolean
          recurrence_rule?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assign_type?: Database["public"]["Enums"]["assign_type"]
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          home_id?: string
          id?: string
          is_recurring?: boolean
          recurrence_rule?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invite_details: {
        Args: { p_code: string }
        Returns: {
          home_id: string
          home_name: string
          invited_by_name: string
          role: string
        }[]
      }
      is_admin_of: { Args: { p_home_id: string }; Returns: boolean }
      is_member_of: { Args: { p_home_id: string }; Returns: boolean }
      is_owner_of: { Args: { p_home_id: string }; Returns: boolean }
      redeem_invite: { Args: { p_code: string }; Returns: string }
      shares_home_with: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      approval_decision: "approved" | "declined"
      approval_policy: "any_admin" | "all_admins"
      assign_type: "member" | "next_visitor"
      booking_status: "pending" | "approved" | "declined" | "cancelled"
      home_role: "owner" | "admin" | "member" | "guest"
      invite_role: "admin" | "member" | "guest"
      invite_status_enum: "pending" | "accepted" | "declined"
      media_type_enum: "image" | "video"
      notification_type:
        | "booking_request"
        | "booking_approved"
        | "booking_declined"
        | "task_assigned"
        | "announcement"
        | "comment"
      task_media_label: "proof" | "reference"
      task_status: "open" | "in_progress" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_decision: ["approved", "declined"],
      approval_policy: ["any_admin", "all_admins"],
      assign_type: ["member", "next_visitor"],
      booking_status: ["pending", "approved", "declined", "cancelled"],
      home_role: ["owner", "admin", "member", "guest"],
      invite_role: ["admin", "member", "guest"],
      invite_status_enum: ["pending", "accepted", "declined"],
      media_type_enum: ["image", "video"],
      notification_type: [
        "booking_request",
        "booking_approved",
        "booking_declined",
        "task_assigned",
        "announcement",
        "comment",
      ],
      task_media_label: ["proof", "reference"],
      task_status: ["open", "in_progress", "done"],
    },
  },
} as const

