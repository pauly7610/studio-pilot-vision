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
      product_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          product_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          product_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          product_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compliance: {
        Row: {
          certification_type: string
          completed_date: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          product_id: string
          status: Database["public"]["Enums"]["compliance_status"]
          updated_at: string | null
        }
        Insert: {
          certification_type: string
          completed_date?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          status: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string | null
        }
        Update: {
          certification_type?: string
          completed_date?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_compliance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_feedback: {
        Row: {
          created_at: string | null
          id: string
          impact_level: string | null
          product_id: string
          raw_text: string
          sentiment_score: number | null
          source: string
          theme: string | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          impact_level?: string | null
          product_id: string
          raw_text: string
          sentiment_score?: number | null
          source: string
          theme?: string | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          impact_level?: string | null
          product_id?: string
          raw_text?: string
          sentiment_score?: number | null
          source?: string
          theme?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_feedback_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_market_evidence: {
        Row: {
          created_at: string | null
          id: string
          measurement_date: string
          merchant_adoption_rate: number | null
          notes: string | null
          product_id: string
          sample_size: number | null
          sentiment_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          measurement_date?: string
          merchant_adoption_rate?: number | null
          notes?: string | null
          product_id: string
          sample_size?: number | null
          sentiment_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          measurement_date?: string
          merchant_adoption_rate?: number | null
          notes?: string | null
          product_id?: string
          sample_size?: number | null
          sentiment_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_market_evidence_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_metrics: {
        Row: {
          active_users: number | null
          actual_revenue: number | null
          adoption_rate: number | null
          churn_rate: number | null
          created_at: string | null
          date: string
          id: string
          product_id: string
          transaction_volume: number | null
        }
        Insert: {
          active_users?: number | null
          actual_revenue?: number | null
          adoption_rate?: number | null
          churn_rate?: number | null
          created_at?: string | null
          date: string
          id?: string
          product_id: string
          transaction_volume?: number | null
        }
        Update: {
          active_users?: number | null
          actual_revenue?: number | null
          adoption_rate?: number | null
          churn_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          product_id?: string
          transaction_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_partners: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          integration_status: string | null
          onboarded_date: string | null
          partner_name: string
          product_id: string
          rail_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          integration_status?: string | null
          onboarded_date?: string | null
          partner_name: string
          product_id: string
          rail_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          integration_status?: string | null
          onboarded_date?: string | null
          partner_name?: string
          product_id?: string
          rail_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_partners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_predictions: {
        Row: {
          failure_risk: number | null
          features: Json | null
          id: string
          model_version: string
          product_id: string
          revenue_probability: number | null
          scored_at: string | null
          success_probability: number | null
        }
        Insert: {
          failure_risk?: number | null
          features?: Json | null
          id?: string
          model_version: string
          product_id: string
          revenue_probability?: number | null
          scored_at?: string | null
          success_probability?: number | null
        }
        Update: {
          failure_risk?: number | null
          features?: Json | null
          id?: string
          model_version?: string
          product_id?: string
          revenue_probability?: number | null
          scored_at?: string | null
          success_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_predictions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_readiness: {
        Row: {
          compliance_complete: boolean | null
          documentation_score: number | null
          evaluated_at: string | null
          id: string
          onboarding_complete: boolean | null
          partner_enabled_pct: number | null
          product_id: string
          readiness_score: number
          risk_band: Database["public"]["Enums"]["risk_band"]
          sales_training_pct: number | null
        }
        Insert: {
          compliance_complete?: boolean | null
          documentation_score?: number | null
          evaluated_at?: string | null
          id?: string
          onboarding_complete?: boolean | null
          partner_enabled_pct?: number | null
          product_id: string
          readiness_score: number
          risk_band: Database["public"]["Enums"]["risk_band"]
          sales_training_pct?: number | null
        }
        Update: {
          compliance_complete?: boolean | null
          documentation_score?: number | null
          evaluated_at?: string | null
          id?: string
          onboarding_complete?: boolean | null
          partner_enabled_pct?: number | null
          product_id?: string
          readiness_score?: number
          risk_band?: Database["public"]["Enums"]["risk_band"]
          sales_training_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_readiness_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          budget_code: string | null
          business_sponsor: string | null
          created_at: string | null
          engineering_lead: string | null
          gating_status: string | null
          gating_status_since: string | null
          governance_tier: string | null
          id: string
          launch_date: string | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"]
          name: string
          owner_email: string
          pii_flag: boolean | null
          product_type: Database["public"]["Enums"]["product_type"]
          region: string
          revenue_target: number | null
          success_metric: string | null
          updated_at: string | null
        }
        Insert: {
          budget_code?: string | null
          business_sponsor?: string | null
          created_at?: string | null
          engineering_lead?: string | null
          gating_status?: string | null
          gating_status_since?: string | null
          governance_tier?: string | null
          id?: string
          launch_date?: string | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"]
          name: string
          owner_email: string
          pii_flag?: boolean | null
          product_type: Database["public"]["Enums"]["product_type"]
          region?: string
          revenue_target?: number | null
          success_metric?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_code?: string | null
          business_sponsor?: string | null
          created_at?: string | null
          engineering_lead?: string | null
          gating_status?: string | null
          gating_status_since?: string | null
          governance_tier?: string | null
          id?: string
          launch_date?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          name?: string
          owner_email?: string
          pii_flag?: boolean | null
          product_type?: Database["public"]["Enums"]["product_type"]
          region?: string
          revenue_target?: number | null
          success_metric?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_training: {
        Row: {
          coverage_pct: number | null
          id: string
          last_training_date: string | null
          product_id: string
          total_reps: number
          trained_reps: number
          updated_at: string | null
        }
        Insert: {
          coverage_pct?: number | null
          id?: string
          last_training_date?: string | null
          product_id: string
          total_reps?: number
          trained_reps?: number
          updated_at?: string | null
        }
        Update: {
          coverage_pct?: number | null
          id?: string
          last_training_date?: string | null
          product_id?: string
          total_reps?: number
          trained_reps?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      compliance_status: "pending" | "in_progress" | "complete"
      lifecycle_stage:
        | "concept"
        | "early_pilot"
        | "pilot"
        | "commercial"
        | "sunset"
      product_type:
        | "data_services"
        | "payment_flows"
        | "core_products"
        | "partnerships"
      risk_band: "low" | "medium" | "high"
      user_role:
        | "vp_product"
        | "studio_ambassador"
        | "regional_lead"
        | "sales"
        | "partner_ops"
        | "viewer"
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
      compliance_status: ["pending", "in_progress", "complete"],
      lifecycle_stage: [
        "concept",
        "early_pilot",
        "pilot",
        "commercial",
        "sunset",
      ],
      product_type: [
        "data_services",
        "payment_flows",
        "core_products",
        "partnerships",
      ],
      risk_band: ["low", "medium", "high"],
      user_role: [
        "vp_product",
        "studio_ambassador",
        "regional_lead",
        "sales",
        "partner_ops",
        "viewer",
      ],
    },
  },
} as const
