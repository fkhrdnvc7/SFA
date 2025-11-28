export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          job_id: string | null
          notes: string | null
          time_in: string | null
          time_out: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          time_in?: string | null
          time_out?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          time_in?: string | null
          time_out?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_items: {
        Row: {
          bonus_amount: number | null
          bonus_note: string | null
          color: string | null
          created_at: string
          id: string
          item_date: string | null
          job_id: string
          operation_id: string
          order_number: number | null
          quantity: number
          seamstress_id: string | null
          size: string | null
          unit_price: number
        }
        Insert: {
          bonus_amount?: number | null
          bonus_note?: string | null
          color?: string | null
          created_at?: string
          id?: string
          item_date?: string | null
          job_id: string
          operation_id: string
          order_number?: number | null
          quantity?: number
          seamstress_id?: string | null
          size?: string | null
          unit_price: number
        }
        Update: {
          bonus_amount?: number | null
          bonus_note?: string | null
          color?: string | null
          created_at?: string
          id?: string
          item_date?: string | null
          job_id?: string
          operation_id?: string
          order_number?: number | null
          quantity?: number
          seamstress_id?: string | null
          size?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_seamstress_id_fkey"
            columns: ["seamstress_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          seamstress_id: string
          status: Database["public"]["Enums"]["task_status"]
          task_date: string
          task_description: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          seamstress_id: string
          status?: Database["public"]["Enums"]["task_status"]
          task_date?: string
          task_description: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          seamstress_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          task_date?: string
          task_description?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_seamstress_id_fkey"
            columns: ["seamstress_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          expense_name: string
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          expense_date?: string
          expense_name: string
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          expense_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_jobs: {
        Row: {
          client_price_per_unit: number | null
          created_at: string
          created_by: string
          date: string
          defective_items: number | null
          extra_work: number | null
          id: string
          job_name: string
          notes: string | null
          quantity: number
          worker_cost_per_unit: number | null
        }
        Insert: {
          client_price_per_unit?: number | null
          created_at?: string
          created_by: string
          date?: string
          defective_items?: number | null
          extra_work?: number | null
          id?: string
          job_name: string
          notes?: string | null
          quantity?: number
          worker_cost_per_unit?: number | null
        }
        Update: {
          client_price_per_unit?: number | null
          created_at?: string
          created_by?: string
          date?: string
          defective_items?: number | null
          extra_work?: number | null
          id?: string
          job_name?: string
          notes?: string | null
          quantity?: number
          worker_cost_per_unit?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string
          completed_at: string | null
          id: string
          job_name: string
          notes: string | null
          status: Database["public"]["Enums"]["job_status"]
          total_estimated_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          completed_at?: string | null
          id?: string
          job_name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          total_estimated_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          completed_at?: string | null
          id?: string
          job_name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          total_estimated_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          code: string | null
          created_at: string
          default_price: number | null
          id: string
          name: string
          unit: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          default_price?: number | null
          id?: string
          name: string
          unit?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          default_price?: number | null
          id?: string
          name?: string
          unit?: string | null
        }
        Relationships: []
      }
      outgoing_jobs: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          incoming_job_id: string
          notes: string | null
          quantity_sent: number
        }
        Insert: {
          created_at?: string
          created_by: string
          date?: string
          id?: string
          incoming_job_id: string
          notes?: string | null
          quantity_sent?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          incoming_job_id?: string
          notes?: string | null
          quantity_sent?: number
        }
        Relationships: [
          {
            foreignKeyName: "outgoing_jobs_incoming_job_id_fkey"
            columns: ["incoming_job_id"]
            isOneToOne: false
            referencedRelation: "incoming_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          bonus_amount: number | null
          bonus_note: string | null
          created_at: string
          created_by: string
          id: string
          month: number
          notes: string | null
          paid_amount: number
          payment_date: string | null
          seamstress_id: string
          status: Database["public"]["Enums"]["payroll_status"]
          total_amount: number
          updated_at: string
          year: number
        }
        Insert: {
          bonus_amount?: number | null
          bonus_note?: string | null
          created_at?: string
          created_by: string
          id?: string
          month: number
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          seamstress_id: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_amount?: number
          updated_at?: string
          year: number
        }
        Update: {
          bonus_amount?: number | null
          bonus_note?: string | null
          created_at?: string
          created_by?: string
          id?: string
          month?: number
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          seamstress_id?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_amount?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_seamstress_id_fkey"
            columns: ["seamstress_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_login?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sizes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      job_status: "ochiq" | "yopiq"
      payroll_status: "tolangan" | "tolanmagan" | "qisman"
      task_status: "bajarilmagan" | "qisman" | "bajarilgan"
      user_role: "ADMIN" | "MANAGER" | "SEAMSTRESS"
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
  public: {
    Enums: {
      job_status: ["ochiq", "yopiq"],
      payroll_status: ["tolangan", "tolanmagan", "qisman"],
      user_role: ["ADMIN", "MANAGER", "SEAMSTRESS"],
    },
  },
} as const
