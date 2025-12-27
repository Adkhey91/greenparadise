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
      formulas: {
        Row: {
          actif: boolean
          created_at: string
          description_courte: string | null
          id: string
          nb_personnes: number
          nom: string
          photo_filename: string | null
          photo_url: string | null
          prix_dzd: number
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description_courte?: string | null
          id?: string
          nb_personnes?: number
          nom: string
          photo_filename?: string | null
          photo_url?: string | null
          prix_dzd?: number
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description_courte?: string | null
          id?: string
          nb_personnes?: number
          nom?: string
          photo_filename?: string | null
          photo_url?: string | null
          prix_dzd?: number
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      messages_contact: {
        Row: {
          created_at: string
          email: string
          id: string
          lu: boolean | null
          message: string
          nom: string
          sujet: string | null
          telephone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lu?: boolean | null
          message: string
          nom: string
          sujet?: string | null
          telephone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lu?: boolean | null
          message?: string
          nom?: string
          sujet?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      park_tables: {
        Row: {
          capacite: number
          created_at: string
          formule_id: string
          id: string
          nom_ou_numero: string
          statut: string
          updated_at: string
        }
        Insert: {
          capacite?: number
          created_at?: string
          formule_id: string
          id?: string
          nom_ou_numero: string
          statut?: string
          updated_at?: string
        }
        Update: {
          capacite?: number
          created_at?: string
          formule_id?: string
          id?: string
          nom_ou_numero?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_tables_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formulas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          date_reservation: string
          email: string | null
          formule: string
          id: string
          message: string | null
          nom: string
          nombre_personnes: number | null
          statut: string | null
          telephone: string
        }
        Insert: {
          created_at?: string
          date_reservation: string
          email?: string | null
          formule: string
          id?: string
          message?: string | null
          nom: string
          nombre_personnes?: number | null
          statut?: string | null
          telephone: string
        }
        Update: {
          created_at?: string
          date_reservation?: string
          email?: string | null
          formule?: string
          id?: string
          message?: string | null
          nom?: string
          nombre_personnes?: number | null
          statut?: string | null
          telephone?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
