export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contact_details: {
        Row: {
          created_at: string
          detail: string
          id: number
          type: Database["public"]["Enums"]["ContactTypes"]
          user_id: string
        }
        Insert: {
          created_at?: string
          detail: string
          id?: number
          type: Database["public"]["Enums"]["ContactTypes"]
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: number
          type?: Database["public"]["Enums"]["ContactTypes"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_status: {
        Row: {
          contact_id: number
          created_at: string
          id: number
          is_verified: boolean
          verified_at: string | null
        }
        Insert: {
          contact_id: number
          created_at?: string
          id?: number
          is_verified?: boolean
          verified_at?: string | null
        }
        Update: {
          contact_id?: number
          created_at?: string
          id?: number
          is_verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_status_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_details"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_profile: {
        Row: {
          created_at: string
          followers: string
          id: number
          is_verified: boolean
          name: string
          platform: Database["public"]["Enums"]["Platforms"]
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          followers: string
          id?: number
          is_verified?: boolean
          name: string
          platform: Database["public"]["Enums"]["Platforms"]
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          followers?: string
          id?: number
          is_verified?: boolean
          name?: string
          platform?: Database["public"]["Enums"]["Platforms"]
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string
          id: string
          name: string
          profile_pic: string | null
          role: Database["public"]["Enums"]["Roles"][]
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          profile_pic?: string | null
          role: Database["public"]["Enums"]["Roles"][]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          profile_pic?: string | null
          role?: Database["public"]["Enums"]["Roles"][]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ContactTypes: "EMAIL" | "MOBILE" | "WHATSAPP"
      Platforms: "YOUTUBE" | "FACEBOOK" | "TIKTOK" | "INSTAGRAM"
      Roles: "ADMIN" | "BUYER" | "INFLUENCER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ContactTypes: ["EMAIL", "MOBILE", "WHATSAPP"],
      Platforms: ["YOUTUBE", "FACEBOOK", "TIKTOK", "INSTAGRAM"],
      Roles: ["ADMIN", "BUYER", "INFLUENCER"],
    },
  },
} as const
