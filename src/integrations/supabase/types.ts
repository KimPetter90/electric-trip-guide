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
      api_usage_log: {
        Row: {
          client_ip: string | null
          created_at: string
          endpoint: string
          id: string
          response_status: number | null
          user_agent: string | null
        }
        Insert: {
          client_ip?: string | null
          created_at?: string
          endpoint: string
          id?: string
          response_status?: number | null
          user_agent?: string | null
        }
        Update: {
          client_ip?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          response_status?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      charging_stations: {
        Row: {
          address: string | null
          available: number
          cost: number
          created_at: string
          fast_charger: boolean
          id: string
          latitude: number
          location: string
          longitude: number
          name: string
          power: string
          provider: string | null
          total: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          available?: number
          cost?: number
          created_at?: string
          fast_charger?: boolean
          id?: string
          latitude: number
          location: string
          longitude: number
          name: string
          power?: string
          provider?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          available?: number
          cost?: number
          created_at?: string
          fast_charger?: boolean
          id?: string
          latitude?: number
          location?: string
          longitude?: number
          name?: string
          power?: string
          provider?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorite_car: {
        Row: {
          battery_capacity: number
          car_brand: string
          car_id: string
          car_image: string | null
          car_model: string
          consumption: number
          created_at: string
          id: string
          range_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          battery_capacity: number
          car_brand: string
          car_id: string
          car_image?: string | null
          car_model: string
          consumption: number
          created_at?: string
          id?: string
          range_km: number
          updated_at?: string
          user_id: string
        }
        Update: {
          battery_capacity?: number
          car_brand?: string
          car_id?: string
          car_image?: string | null
          car_model?: string
          consumption?: number
          created_at?: string
          id?: string
          range_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_routes: {
        Row: {
          battery_usage: string | null
          created_at: string
          distance: string | null
          duration: string | null
          estimated_cost: string | null
          from_location: string
          id: string
          name: string
          to_location: string
          updated_at: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          battery_usage?: string | null
          created_at?: string
          distance?: string | null
          duration?: string | null
          estimated_cost?: string | null
          from_location: string
          id?: string
          name: string
          to_location: string
          updated_at?: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          battery_usage?: string | null
          created_at?: string
          distance?: string | null
          duration?: string | null
          estimated_cost?: string | null
          from_location?: string
          id?: string
          name?: string
          to_location?: string
          updated_at?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          created_at: string
          id: string
          integration_type: string
          is_active: boolean
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_type: string
          is_active?: boolean
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proof_cards: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          id: string
          image_data: string | null
          image_url: string
          is_synced: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          timestamp: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_data?: string | null
          image_url: string
          is_synced?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          timestamp?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_data?: string | null
          image_url?: string
          is_synced?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          timestamp?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proof_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_recommendations: {
        Row: {
          category: string
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          provider_name: string
          referral_link: string | null
          savings_percentage: number
        }
        Insert: {
          category: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          provider_name: string
          referral_link?: string | null
          savings_percentage: number
        }
        Update: {
          category?: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          provider_name?: string
          referral_link?: string | null
          savings_percentage?: number
        }
        Relationships: []
      }
      savings_progress: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          id: string
          monthly_savings: number
          new_amount: number
          old_amount: number
          provider_new: string | null
          provider_old: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string
          id?: string
          monthly_savings: number
          new_amount: number
          old_amount: number
          provider_new?: string | null
          provider_old?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          monthly_savings?: number
          new_amount?: number
          old_amount?: number
          provider_new?: string | null
          provider_old?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_expenses: {
        Row: {
          created_at: string
          forsikring: number | null
          id: string
          lan: number | null
          mobil: number | null
          streaming: number | null
          strom: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          forsikring?: number | null
          id?: string
          lan?: number | null
          mobil?: number | null
          streaming?: number | null
          strom?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          forsikring?: number | null
          id?: string
          lan?: number | null
          mobil?: number | null
          streaming?: number | null
          strom?: number | null
          updated_at?: string
          user_id?: string
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
      user_settings: {
        Row: {
          auto_backup: boolean | null
          created_at: string
          id: string
          is_test_user: boolean | null
          is_trial_active: boolean | null
          last_reset_date: string | null
          last_route_reset_date: string | null
          location_enabled: boolean | null
          monthly_proof_count: number | null
          monthly_route_count: number | null
          notification_enabled: boolean | null
          plan_type: string | null
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_product_id: string | null
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_backup?: boolean | null
          created_at?: string
          id?: string
          is_test_user?: boolean | null
          is_trial_active?: boolean | null
          last_reset_date?: string | null
          last_route_reset_date?: string | null
          location_enabled?: boolean | null
          monthly_proof_count?: number | null
          monthly_route_count?: number | null
          notification_enabled?: boolean | null
          plan_type?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_backup?: boolean | null
          created_at?: string
          id?: string
          is_test_user?: boolean | null
          is_trial_active?: boolean | null
          last_reset_date?: string | null
          last_route_reset_date?: string | null
          location_enabled?: boolean | null
          monthly_proof_count?: number | null
          monthly_route_count?: number | null
          notification_enabled?: boolean | null
          plan_type?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_monthly_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      check_route_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_daily_analytics: {
        Args: { days_back: number }
        Returns: {
          date: string
          logged_in_users: number
          total_pageviews: number
          total_sessions: number
          unique_sessions: number
        }[]
      }
      has_premium_access: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_route_count: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      is_trial_active: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      reset_route_count: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      reset_user_routes_by_email: {
        Args: { target_email: string }
        Returns: boolean
      }
      upgrade_to_test_user: {
        Args: { target_email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
