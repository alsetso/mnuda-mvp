export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Type aliases for convenience
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserType = 'free' | 'premium' | 'admin' | 'buyer' | 'realtor' | 'investor' | 'wholesaler' | 'owner' | 'lender' | 'appraiser' | 'contractor' | 'other'
export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'free' | 'trial'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          company: string | null
          job_title: string | null
          location: string | null
          bio: string | null
          website: string | null
          linkedin_url: string | null
          timezone: string | null
          created_at: string | null
          updated_at: string | null
          stripe_customer_id: string | null
          active_subscription_id: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          location?: string | null
          bio?: string | null
          website?: string | null
          linkedin_url?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
          stripe_customer_id?: string | null
          active_subscription_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          location?: string | null
          bio?: string | null
          website?: string | null
          linkedin_url?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
          stripe_customer_id?: string | null
          active_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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

// Type aliases for profiles table
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']