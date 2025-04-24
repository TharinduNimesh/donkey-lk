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
      account_balance: {
        Row: {
          balance: number
          created_at: string
          id: number
          last_withdrawal: string | null
          total_earning: number
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: number
          last_withdrawal?: string | null
          total_earning?: number
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: number
          last_withdrawal?: string | null
          total_earning?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      application_promises: {
        Row: {
          application_id: number
          created_at: string
          est_profit: string
          id: number
          platform: Database["public"]["Enums"]["Platforms"]
          promised_reach: string
        }
        Insert: {
          application_id: number
          created_at?: string
          est_profit: string
          id?: number
          platform: Database["public"]["Enums"]["Platforms"]
          promised_reach: string
        }
        Update: {
          application_id?: number
          created_at?: string
          est_profit?: string
          id?: number
          platform?: Database["public"]["Enums"]["Platforms"]
          promised_reach?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_promises_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "task_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_proofs: {
        Row: {
          application_id: number
          content: string
          created_at: string
          id: number
          platform: Database["public"]["Enums"]["Platforms"]
          proof_type: Database["public"]["Enums"]["ProofType"]
        }
        Insert: {
          application_id: number
          content: string
          created_at?: string
          id?: number
          platform: Database["public"]["Enums"]["Platforms"]
          proof_type: Database["public"]["Enums"]["ProofType"]
        }
        Update: {
          application_id?: number
          content?: string
          created_at?: string
          id?: number
          platform?: Database["public"]["Enums"]["Platforms"]
          proof_type?: Database["public"]["Enums"]["ProofType"]
        }
        Relationships: [
          {
            foreignKeyName: "application_proofs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "task_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfer_slip: {
        Row: {
          created_at: string
          id: number
          slip: string
          task_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          slip: string
          task_id: number
        }
        Update: {
          created_at?: string
          id?: number
          slip?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfer_slip_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_details"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "bank_transfer_slip_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_details_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "bank_transfer_slip_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfer_status: {
        Row: {
          created_at: string
          id: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["BankTransferStatus"]
          transfer_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["BankTransferStatus"]
          transfer_id: number
        }
        Update: {
          created_at?: string
          id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["BankTransferStatus"]
          transfer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfer_status_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_status_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: true
            referencedRelation: "bank_transfer_slip"
            referencedColumns: ["id"]
          },
        ]
      }
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
            isOneToOne: true
            referencedRelation: "contact_details"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_verifications: {
        Row: {
          code: number
          contact_id: number
          created_at: string
          expired_at: string
          id: number
        }
        Insert: {
          code: number
          contact_id: number
          created_at?: string
          expired_at: string
          id?: number
        }
        Update: {
          code?: number
          contact_id?: number
          created_at?: string
          expired_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_verifications_contact_id_fkey"
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
          profile_pic: string | null
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
          profile_pic?: string | null
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
          profile_pic?: string | null
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
      influencer_profile_verification_requests: {
        Row: {
          created_at: string
          id: number
          platform: Database["public"]["Enums"]["Platforms"]
          profile_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          platform: Database["public"]["Enums"]["Platforms"]
          profile_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          platform?: Database["public"]["Enums"]["Platforms"]
          profile_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_profile_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_profile_verifications: {
        Row: {
          code: string
          created_at: string
          id: number
          is_used: boolean
          profile_id: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          is_used?: boolean
          profile_id: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          is_used?: boolean
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "influencer_profile_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "influencer_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          profile_pic: string | null
          role: Database["public"]["Enums"]["Roles"][]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          profile_pic?: string | null
          role: Database["public"]["Enums"]["Roles"][]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          profile_pic?: string | null
          role?: Database["public"]["Enums"]["Roles"][]
        }
        Relationships: []
      }
      proof_status: {
        Row: {
          created_at: string
          id: number
          proof_id: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["ProofStatus"]
        }
        Insert: {
          created_at?: string
          id?: number
          proof_id: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ProofStatus"]
        }
        Update: {
          created_at?: string
          id?: number
          proof_id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ProofStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "proof_status_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: true
            referencedRelation: "application_proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_status_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      task_applications: {
        Row: {
          created_at: string
          id: number
          is_cancelled: boolean
          task_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_cancelled?: boolean
          task_id: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_cancelled?: boolean
          task_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_details"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_details_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      task_cost: {
        Row: {
          amount: number
          created_at: string
          id: number
          is_paid: boolean
          metadata: Json | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["PaymentMethod"]
          task_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          is_paid?: boolean
          metadata?: Json | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["PaymentMethod"]
          task_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          is_paid?: boolean
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["PaymentMethod"]
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_cost_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "task_details"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_cost_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "task_details_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_cost_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_targets: {
        Row: {
          created_at: string
          due_date: string | null
          id: number
          platform: Database["public"]["Enums"]["Platforms"]
          task_id: number
          views: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: number
          platform: Database["public"]["Enums"]["Platforms"]
          task_id: number
          views: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: number
          platform?: Database["public"]["Enums"]["Platforms"]
          task_id?: number
          views?: string
        }
        Relationships: [
          {
            foreignKeyName: "targets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_details"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "targets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_details_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "targets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: number
          source: string
          status: Database["public"]["Enums"]["TaskStatus"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: number
          source: string
          status?: Database["public"]["Enums"]["TaskStatus"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: number
          source?: string
          status?: Database["public"]["Enums"]["TaskStatus"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_options: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch_name: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch_name: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch_name?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_options_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_request_status: {
        Row: {
          created_at: string
          id: number
          request_id: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["WithdrawalStatus"]
        }
        Insert: {
          created_at?: string
          id?: number
          request_id: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["WithdrawalStatus"]
        }
        Update: {
          created_at?: string
          id?: number
          request_id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["WithdrawalStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_request_status_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_request_status_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: number
          user_id: string
          withdrawal_option_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          user_id?: string
          withdrawal_option_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          user_id?: string
          withdrawal_option_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_withdrawal_option_id_fkey"
            columns: ["withdrawal_option_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_options"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      task_details: {
        Row: {
          completed_at: string | null
          cost: Json | null
          created_at: string | null
          description: string | null
          source: string | null
          status: Database["public"]["Enums"]["TaskStatus"] | null
          targets: Json | null
          task_id: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      task_details_view: {
        Row: {
          completed_at: string | null
          cost: Json | null
          created_at: string | null
          description: string | null
          source: string | null
          status: Database["public"]["Enums"]["TaskStatus"] | null
          targets: Json | null
          task_id: number | null
          title: string | null
          total_influencers: number | null
          total_promised_views: number | null
          total_target_views: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_influencer_verification: {
        Args: {
          p_request_id: number
          p_name: string
          p_followers: string
          p_pic: string
        }
        Returns: undefined
      }
      get_dashboard_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_buyers: number
          total_influencers: number
          active_tasks: number
          total_campaign_tasks: number
          total_revenue: number
          total_monthly_revenue: number
          pending_payments: number
        }[]
      }
      is_a_buyer: {
        Args: { user_id_input: string }
        Returns: boolean
      }
      is_a_superadmin: {
        Args: { user_id_input: string }
        Returns: boolean
      }
      is_active_task: {
        Args: { task_id_input: number }
        Returns: boolean
      }
      is_an_admin: {
        Args: { user_id_input: string }
        Returns: boolean
      }
      is_an_influencer: {
        Args: { user_id_input: string }
        Returns: boolean
      }
      is_it_my_application: {
        Args: { application_id_input: number }
        Returns: boolean
      }
      is_it_my_contact: {
        Args: { contact_id_input: number }
        Returns: boolean
      }
      is_it_my_task: {
        Args: { task_id_input: number }
        Returns: boolean
      }
      update_bank_transfer_payment: {
        Args: {
          transfer_id_param: number
          task_cost_id_param: number
          is_accepted_param: boolean
        }
        Returns: undefined
      }
      verify_youtube_channel: {
        Args: { p_profile_id: number; p_verification_id: number }
        Returns: undefined
      }
    }
    Enums: {
      BankTransferStatus: "PENDING" | "ACCEPTED" | "REJECTED"
      ContactTypes: "EMAIL" | "MOBILE" | "WHATSAPP"
      PaymentMethod: "PAYMENT_GATEWAY" | "BANK_TRANSFER"
      Platforms: "YOUTUBE" | "FACEBOOK" | "TIKTOK" | "INSTAGRAM"
      ProofStatus: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"
      ProofType: "IMAGE" | "URL"
      Roles: "ADMIN" | "BUYER" | "INFLUENCER"
      TaskStatus: "DRAFT" | "ACTIVE" | "ARCHIVED" | "COMPLETED"
      WithdrawalStatus: "PENDING" | "ACCEPTED" | "REJECTED"
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
      BankTransferStatus: ["PENDING", "ACCEPTED", "REJECTED"],
      ContactTypes: ["EMAIL", "MOBILE", "WHATSAPP"],
      PaymentMethod: ["PAYMENT_GATEWAY", "BANK_TRANSFER"],
      Platforms: ["YOUTUBE", "FACEBOOK", "TIKTOK", "INSTAGRAM"],
      ProofStatus: ["UNDER_REVIEW", "ACCEPTED", "REJECTED"],
      ProofType: ["IMAGE", "URL"],
      Roles: ["ADMIN", "BUYER", "INFLUENCER"],
      TaskStatus: ["DRAFT", "ACTIVE", "ARCHIVED", "COMPLETED"],
      WithdrawalStatus: ["PENDING", "ACCEPTED", "REJECTED"],
    },
  },
} as const
