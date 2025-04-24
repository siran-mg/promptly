export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          email: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          email?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          client_name: string
          client_email: string
          client_phone: string
          date: string
          notes: string | null
          status: string
          share_token: string
          appointment_type_id: string | null
          metadata: Json | null
          calendar_integration_id: string | null
          external_calendar_event_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          client_name: string
          client_email: string
          client_phone: string
          date: string
          notes?: string | null
          status?: string
          share_token?: string
          appointment_type_id?: string | null
          metadata?: Json | null
          calendar_integration_id?: string | null
          external_calendar_event_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          client_name?: string
          client_email?: string
          client_phone?: string
          date?: string
          notes?: string | null
          status?: string
          share_token?: string
          appointment_type_id?: string | null
          metadata?: Json | null
          calendar_integration_id?: string | null
          external_calendar_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      form_settings: {
        Row: {
          id: string
          user_id: string
          form_title: string
          form_description: string
          logo_url: string | null
          accent_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          form_title?: string
          form_description?: string
          logo_url?: string | null
          accent_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          form_title?: string
          form_description?: string
          logo_url?: string | null
          accent_color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      form_share_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_share_tokens_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      appointment_types: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          duration: number
          color: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          duration?: number
          color?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          duration?: number
          color?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_types_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      appointment_custom_fields: {
        Row: {
          id: string
          user_id: string
          appointment_type_id: string | null
          name: string
          label: string
          type: string
          required: boolean
          options: Json | null
          placeholder: string | null
          default_value: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          appointment_type_id?: string | null
          name: string
          label: string
          type: string
          required?: boolean
          options?: Json | null
          placeholder?: string | null
          default_value?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          appointment_type_id?: string | null
          name?: string
          label?: string
          type?: string
          required?: boolean
          options?: Json | null
          placeholder?: string | null
          default_value?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_custom_fields_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_custom_fields_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          }
        ]
      },
      appointment_field_values: {
        Row: {
          id: string
          appointment_id: string
          field_id: string
          value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          field_id: string
          value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          field_id?: string
          value?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_field_values_appointment_id_fkey"
            columns: ["appointment_id"]
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_field_values_field_id_fkey"
            columns: ["field_id"]
            referencedRelation: "appointment_custom_fields"
            referencedColumns: ["id"]
          }
        ]
      },
      calendar_integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          calendar_id: string | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          calendar_id?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          calendar_id?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      form_settings_per_type: {
        Row: {
          id: string
          user_id: string
          appointment_type_id: string
          form_title: string | null
          form_description: string | null
          logo_url: string | null
          accent_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          appointment_type_id: string
          form_title?: string | null
          form_description?: string | null
          logo_url?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          appointment_type_id?: string
          form_title?: string | null
          form_description?: string | null
          logo_url?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_settings_per_type_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_settings_per_type_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          }
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
  }
}
