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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      order_events: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          author: string | null
          content: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string
          id?: string
          order_id: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assignee: string | null
          callback_at: string | null
          cancel_reason: string | null
          city: string
          contact_period: string | null
          contact_slot: string | null
          created_at: string
          customer_name: string
          delivered_at: string | null
          delivery_cost: number
          id: string
          neighborhood: string
          order_number: number
          phone: string
          product_id: string | null
          product_name: string
          province: string
          quantity: number
          reference_point: string | null
          status: string
          total: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          callback_at?: string | null
          cancel_reason?: string | null
          city: string
          contact_period?: string | null
          contact_slot?: string | null
          created_at?: string
          customer_name: string
          delivered_at?: string | null
          delivery_cost?: number
          id?: string
          neighborhood: string
          order_number?: number
          phone: string
          product_id?: string | null
          product_name: string
          province: string
          quantity?: number
          reference_point?: string | null
          status?: string
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          callback_at?: string | null
          cancel_reason?: string | null
          city?: string
          contact_period?: string | null
          contact_slot?: string | null
          created_at?: string
          customer_name?: string
          delivered_at?: string | null
          delivery_cost?: number
          id?: string
          neighborhood?: string
          order_number?: number
          phone?: string
          product_id?: string | null
          product_name?: string
          province?: string
          quantity?: number
          reference_point?: string | null
          status?: string
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          action_button_color: string | null
          action_button_text: string | null
          active: boolean
          cities: string[]
          created_at: string
          delivery_cost: number
          delivery_time: string | null
          gallery: string[]
          id: string
          image_url: string | null
          name: string
          price: number
          product_cost: number
          promo_price: number | null
          provinces: string[]
          short_description: string | null
          slug: string
          stock: number
          timer_color: string | null
          timer_minutes: number | null
          timer_seconds: number | null
          updated_at: string
        }
        Insert: {
          action_button_color?: string | null
          action_button_text?: string | null
          active?: boolean
          cities?: string[]
          created_at?: string
          delivery_cost?: number
          delivery_time?: string | null
          gallery?: string[]
          id?: string
          image_url?: string | null
          name: string
          price?: number
          product_cost?: number
          promo_price?: number | null
          provinces?: string[]
          short_description?: string | null
          slug: string
          stock?: number
          timer_color?: string | null
          timer_minutes?: number | null
          timer_seconds?: number | null
          updated_at?: string
        }
        Update: {
          action_button_color?: string | null
          action_button_text?: string | null
          active?: boolean
          cities?: string[]
          created_at?: string
          delivery_cost?: number
          delivery_time?: string | null
          gallery?: string[]
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          product_cost?: number
          promo_price?: number | null
          provinces?: string[]
          short_description?: string | null
          slug?: string
          stock?: number
          timer_color?: string | null
          timer_minutes?: number | null
          timer_seconds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          role?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      get_order_receipt: {
        Args: { p_id: string }
        Returns: {
          city: string
          created_at: string
          customer_name: string
          delivery_cost: number
          id: string
          neighborhood: string
          order_number: number
          phone: string
          product_name: string
          province: string
          quantity: number
          reference_point: string
          total: number
          unit_price: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "administrador" | "gestor" | "operador" | "entregador"
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
      app_role: ["administrador", "gestor", "operador", "entregador"],
    },
  },
} as const
