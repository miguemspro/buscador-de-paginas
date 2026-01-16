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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          lead_company: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          lead_company?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          lead_company?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      citation_validations: {
        Row: {
          evidence_url: string
          http_status: number | null
          id: string
          is_valid: boolean | null
          playbook_id: string | null
          validated_at: string
          validation_error: string | null
        }
        Insert: {
          evidence_url: string
          http_status?: number | null
          id?: string
          is_valid?: boolean | null
          playbook_id?: string | null
          validated_at?: string
          validation_error?: string | null
        }
        Update: {
          evidence_url?: string
          http_status?: number | null
          id?: string
          is_valid?: boolean | null
          playbook_id?: string | null
          validated_at?: string
          validation_error?: string | null
        }
        Relationships: []
      }
      meta_cases: {
        Row: {
          case_url: string | null
          challenge: string | null
          company_name: string
          company_size: string | null
          country: string | null
          created_at: string
          description: string
          id: string
          industry: string
          industry_keywords: string[]
          is_active: boolean | null
          key_result: string | null
          metrics: Json | null
          product_sold: string | null
          project_date: string | null
          project_type: string | null
          results: string[]
          sap_modules: string[] | null
          sap_solutions: string[]
          solution: string | null
          title: string
          updated_at: string
        }
        Insert: {
          case_url?: string | null
          challenge?: string | null
          company_name: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          description: string
          id?: string
          industry: string
          industry_keywords?: string[]
          is_active?: boolean | null
          key_result?: string | null
          metrics?: Json | null
          product_sold?: string | null
          project_date?: string | null
          project_type?: string | null
          results?: string[]
          sap_modules?: string[] | null
          sap_solutions?: string[]
          solution?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          case_url?: string | null
          challenge?: string | null
          company_name?: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          industry?: string
          industry_keywords?: string[]
          is_active?: boolean | null
          key_result?: string | null
          metrics?: Json | null
          product_sold?: string | null
          project_date?: string | null
          project_type?: string | null
          results?: string[]
          sap_modules?: string[] | null
          sap_solutions?: string[]
          solution?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_solutions: {
        Row: {
          benefits: string[] | null
          category: string
          created_at: string | null
          description: string
          expected_result: string | null
          id: string
          is_active: boolean | null
          name: string
          related_pains: string[] | null
          sap_modules: string[] | null
          target_roles: string[] | null
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          benefits?: string[] | null
          category: string
          created_at?: string | null
          description: string
          expected_result?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          related_pains?: string[] | null
          sap_modules?: string[] | null
          target_roles?: string[] | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          benefits?: string[] | null
          category?: string
          created_at?: string | null
          description?: string
          expected_result?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          related_pains?: string[] | null
          sap_modules?: string[] | null
          target_roles?: string[] | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Relationships: []
      }
      playbook_feedback: {
        Row: {
          case_utilizado: string | null
          comentarios: string | null
          created_at: string | null
          dores_confirmadas: string[] | null
          id: string
          meeting_agendado: boolean | null
          meeting_data: string | null
          playbook_id: string | null
          resposta_lead: string | null
          user_id: string | null
        }
        Insert: {
          case_utilizado?: string | null
          comentarios?: string | null
          created_at?: string | null
          dores_confirmadas?: string[] | null
          id?: string
          meeting_agendado?: boolean | null
          meeting_data?: string | null
          playbook_id?: string | null
          resposta_lead?: string | null
          user_id?: string | null
        }
        Update: {
          case_utilizado?: string | null
          comentarios?: string | null
          created_at?: string | null
          dores_confirmadas?: string[] | null
          id?: string
          meeting_agendado?: boolean | null
          meeting_data?: string | null
          playbook_id?: string | null
          resposta_lead?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_feedback_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbook_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_feedback_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbook_history_public"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_history: {
        Row: {
          cache_hit: boolean | null
          created_at: string
          evidences_count: number | null
          extracted_data: Json | null
          generation_time_ms: number | null
          id: string
          lead_company: string
          lead_email: string | null
          lead_industry: string | null
          lead_name: string | null
          lead_role: string | null
          playbook_data: Json
          sap_status: string | null
          validated_evidences_count: number | null
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string
          evidences_count?: number | null
          extracted_data?: Json | null
          generation_time_ms?: number | null
          id?: string
          lead_company: string
          lead_email?: string | null
          lead_industry?: string | null
          lead_name?: string | null
          lead_role?: string | null
          playbook_data: Json
          sap_status?: string | null
          validated_evidences_count?: number | null
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string
          evidences_count?: number | null
          extracted_data?: Json | null
          generation_time_ms?: number | null
          id?: string
          lead_company?: string
          lead_email?: string | null
          lead_industry?: string | null
          lead_name?: string | null
          lead_role?: string | null
          playbook_data?: Json
          sap_status?: string | null
          validated_evidences_count?: number | null
        }
        Relationships: []
      }
      research_cache: {
        Row: {
          cache_key: string
          cache_type: string
          created_at: string
          expires_at: string
          hit_count: number | null
          id: string
          last_hit_at: string | null
          result_data: Json
        }
        Insert: {
          cache_key: string
          cache_type: string
          created_at?: string
          expires_at: string
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          result_data: Json
        }
        Update: {
          cache_key?: string
          cache_type?: string
          created_at?: string
          expires_at?: string
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          result_data?: Json
        }
        Relationships: []
      }
    }
    Views: {
      playbook_history_public: {
        Row: {
          cache_hit: boolean | null
          created_at: string | null
          evidences_count: number | null
          generation_time_ms: number | null
          id: string | null
          lead_company: string | null
          lead_industry: string | null
          playbook_data: Json | null
          sap_status: string | null
          validated_evidences_count: number | null
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string | null
          evidences_count?: number | null
          generation_time_ms?: number | null
          id?: string | null
          lead_company?: string | null
          lead_industry?: string | null
          playbook_data?: Json | null
          sap_status?: string | null
          validated_evidences_count?: number | null
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string | null
          evidences_count?: number | null
          generation_time_ms?: number | null
          id?: string | null
          lead_company?: string | null
          lead_industry?: string | null
          playbook_data?: Json | null
          sap_status?: string | null
          validated_evidences_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
