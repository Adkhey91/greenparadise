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
      content_sections: {
        Row: {
          actif: boolean
          created_at: string
          description: string | null
          id: string
          ordre: number
          photo_filename: string | null
          photo_url: string | null
          prix_dzd: number | null
          section_type: string
          tags: string[] | null
          titre: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          ordre?: number
          photo_filename?: string | null
          photo_url?: string | null
          prix_dzd?: number | null
          section_type: string
          tags?: string[] | null
          titre: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          ordre?: number
          photo_filename?: string | null
          photo_url?: string | null
          prix_dzd?: number | null
          section_type?: string
          tags?: string[] | null
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          venue_id: string | null
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
          venue_id?: string | null
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
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulas_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          venue_id: string | null
        }
        Insert: {
          capacite?: number
          created_at?: string
          formule_id: string
          id?: string
          nom_ou_numero: string
          statut?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          capacite?: number
          created_at?: string
          formule_id?: string
          id?: string
          nom_ou_numero?: string
          statut?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "park_tables_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          checked_in_at: string | null
          confirmed_at: string | null
          created_at: string
          date_reservation: string
          duration_minutes: number | null
          email: string | null
          formule: string
          id: string
          message: string | null
          nom: string
          nombre_personnes: number | null
          paid_at: string | null
          payment_status: string | null
          reservation_number: string | null
          secure_token: string | null
          source: string | null
          statut: string | null
          table_id: string | null
          telephone: string
          total_price: number | null
          venue_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          date_reservation: string
          duration_minutes?: number | null
          email?: string | null
          formule: string
          id?: string
          message?: string | null
          nom: string
          nombre_personnes?: number | null
          paid_at?: string | null
          payment_status?: string | null
          reservation_number?: string | null
          secure_token?: string | null
          source?: string | null
          statut?: string | null
          table_id?: string | null
          telephone: string
          total_price?: number | null
          venue_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          date_reservation?: string
          duration_minutes?: number | null
          email?: string | null
          formule?: string
          id?: string
          message?: string | null
          nom?: string
          nombre_personnes?: number | null
          paid_at?: string | null
          payment_status?: string | null
          reservation_number?: string | null
          secure_token?: string | null
          source?: string | null
          statut?: string | null
          table_id?: string | null
          telephone?: string
          total_price?: number | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      resto_menu_items: {
        Row: {
          allergenes: string[] | null
          categorie: Database["public"]["Enums"]["resto_categorie"]
          created_at: string
          description: string | null
          disponible: boolean
          id: string
          nom: string
          ordre: number
          photo_filename: string | null
          photo_url: string | null
          prix_dzd: number
          stock: number | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          allergenes?: string[] | null
          categorie: Database["public"]["Enums"]["resto_categorie"]
          created_at?: string
          description?: string | null
          disponible?: boolean
          id?: string
          nom: string
          ordre?: number
          photo_filename?: string | null
          photo_url?: string | null
          prix_dzd: number
          stock?: number | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          allergenes?: string[] | null
          categorie?: Database["public"]["Enums"]["resto_categorie"]
          created_at?: string
          description?: string | null
          disponible?: boolean
          id?: string
          nom?: string
          ordre?: number
          photo_filename?: string | null
          photo_url?: string | null
          prix_dzd?: number
          stock?: number | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resto_menu_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      resto_reservations: {
        Row: {
          created_at: string
          date_reservation: string
          email: string | null
          heure: string
          id: string
          mode_paiement: string | null
          montant_dzd: number | null
          nom: string
          nombre_personnes: number
          notes: string | null
          statut: string
          table_id: string
          telephone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_reservation: string
          email?: string | null
          heure: string
          id?: string
          mode_paiement?: string | null
          montant_dzd?: number | null
          nom: string
          nombre_personnes?: number
          notes?: string | null
          statut?: string
          table_id: string
          telephone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_reservation?: string
          email?: string | null
          heure?: string
          id?: string
          mode_paiement?: string | null
          montant_dzd?: number | null
          nom?: string
          nombre_personnes?: number
          notes?: string | null
          statut?: string
          table_id?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resto_reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "resto_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      resto_tables: {
        Row: {
          capacite: number
          created_at: string
          id: string
          numero: number
          position_x: number
          position_y: number
          statut: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          capacite?: number
          created_at?: string
          id?: string
          numero: number
          position_x?: number
          position_y?: number
          statut?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          capacite?: number
          created_at?: string
          id?: string
          numero?: number
          position_x?: number
          position_y?: number
          statut?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resto_tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
      venues: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_reservable: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_reservable?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_reservable?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_table_availability: {
        Args: {
          p_duration_minutes: number
          p_exclude_reservation_id?: string
          p_start_datetime: string
          p_table_id: string
        }
        Returns: boolean
      }
      generate_reservation_number: { Args: never; Returns: string }
      generate_secure_token: { Args: never; Returns: string }
      generate_venue_reservation_number: {
        Args: { venue_code: string }
        Returns: string
      }
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
      resto_categorie: "entrees" | "plats" | "desserts" | "boissons"
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
      resto_categorie: ["entrees", "plats", "desserts", "boissons"],
    },
  },
} as const
