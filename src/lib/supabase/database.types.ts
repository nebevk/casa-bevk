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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          attributes: Json
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          name: string
          status: Database["public"]["Enums"]["asset_status"]
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attributes?: Json
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["asset_status"]
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attributes?: Json
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["asset_status"]
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["document_entity"]
          household_id: string
          id: string
          label: string | null
          mime_type: string | null
          owner_id: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["item_visibility"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["document_entity"]
          household_id: string
          id?: string
          label?: string | null
          mime_type?: string | null
          owner_id?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["document_entity"]
          household_id?: string
          id?: string
          label?: string | null
          mime_type?: string | null
          owner_id?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          currency: string
          household_id: string
          id: string
          member_id: string | null
          period_month: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          currency?: string
          household_id: string
          id?: string
          member_id?: string | null
          period_month: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          household_id?: string
          id?: string
          member_id?: string | null
          period_month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_household_fkey"
            columns: ["category_id", "household_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          household_id: string
          id: string
          location: string | null
          recurrence_count: number | null
          recurrence_freq: Database["public"]["Enums"]["recurrence_freq"]
          recurrence_interval: number
          recurrence_rule: string | null
          recurrence_until: string | null
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          household_id: string
          id?: string
          location?: string | null
          recurrence_count?: number | null
          recurrence_freq?: Database["public"]["Enums"]["recurrence_freq"]
          recurrence_interval?: number
          recurrence_rule?: string | null
          recurrence_until?: string | null
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          household_id?: string
          id?: string
          location?: string | null
          recurrence_count?: number | null
          recurrence_freq?: Database["public"]["Enums"]["recurrence_freq"]
          recurrence_interval?: number
          recurrence_rule?: string | null
          recurrence_until?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          asset_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["document_entity"]
          file_name: string
          household_id: string
          id: string
          mime_type: string | null
          owner_id: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["item_visibility"]
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["document_entity"]
          file_name: string
          household_id: string
          id?: string
          mime_type?: string | null
          owner_id?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["document_entity"]
          file_name?: string
          household_id?: string
          id?: string
          mime_type?: string | null
          owner_id?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_asset_household_fkey"
            columns: ["asset_id", "household_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string
          event_id: string
          household_id: string
          id: string
          is_sent: boolean
          method: Database["public"]["Enums"]["reminder_method"]
          minutes_before: number | null
          remind_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          household_id: string
          id?: string
          is_sent?: boolean
          method?: Database["public"]["Enums"]["reminder_method"]
          minutes_before?: number | null
          remind_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          household_id?: string
          id?: string
          is_sent?: boolean
          method?: Database["public"]["Enums"]["reminder_method"]
          minutes_before?: number | null
          remind_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_household_fkey"
            columns: ["event_id", "household_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "event_reminders_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          household_id: string
          icon: string | null
          id: string
          is_system: boolean
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          household_id: string
          icon?: string | null
          id?: string
          is_system?: boolean
          kind?: Database["public"]["Enums"]["category_kind"]
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          household_id?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          asset_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          household_id: string
          id: string
          metadata: Json
          occurred_on: string
          paid_by: string | null
          recurring_payment_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          asset_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          household_id: string
          id?: string
          metadata?: Json
          occurred_on?: string
          paid_by?: string | null
          recurring_payment_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          household_id?: string
          id?: string
          metadata?: Json
          occurred_on?: string
          paid_by?: string | null
          recurring_payment_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_asset_household_fkey"
            columns: ["asset_id", "household_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "expenses_category_household_fkey"
            columns: ["category_id", "household_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_household_fkey"
            columns: ["recurring_payment_id", "household_id"]
            isOneToOne: false
            referencedRelation: "recurring_payments"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "expenses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_bill_data: {
        Row: {
          confidence: number | null
          created_at: string
          document_id: string | null
          expense_id: string | null
          extracted: Json
          household_id: string
          id: string
          owner_id: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_id?: string | null
          expense_id?: string | null
          extracted?: Json
          household_id: string
          id?: string
          owner_id?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_id?: string | null
          expense_id?: string | null
          extracted?: Json
          household_id?: string
          id?: string
          owner_id?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_bill_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_bill_data_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_bill_data_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_bill_data_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_settings: {
        Row: {
          created_at: string
          currency: string
          household_id: string
          locale: string
          name: string
          timezone: string
          updated_at: string
          week_start: number
        }
        Insert: {
          created_at?: string
          currency?: string
          household_id: string
          locale?: string
          name?: string
          timezone?: string
          updated_at?: string
          week_start?: number
        }
        Update: {
          created_at?: string
          currency?: string
          household_id?: string
          locale?: string
          name?: string
          timezone?: string
          updated_at?: string
          week_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "household_settings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string
          owner_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          owner_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          owner_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_log: {
        Row: {
          asset_id: string
          cost: number | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expense_id: string | null
          household_id: string
          id: string
          next_service_on: string | null
          odometer: number | null
          performed_on: string
          title: string
          updated_at: string
          updated_by: string | null
          vendor: string | null
        }
        Insert: {
          asset_id: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_id?: string | null
          household_id: string
          id?: string
          next_service_on?: string | null
          odometer?: number | null
          performed_on?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
        }
        Update: {
          asset_id?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_id?: string | null
          household_id?: string
          id?: string
          next_service_on?: string | null
          odometer?: number | null
          performed_on?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_log_asset_household_fkey"
            columns: ["asset_id", "household_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "maintenance_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_log_expense_household_fkey"
            columns: ["expense_id", "household_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "maintenance_log_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_log_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_embeddings: {
        Row: {
          content_hash: string | null
          created_at: string
          embedding: string | null
          household_id: string
          note_id: string
          updated_at: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          embedding?: string | null
          household_id: string
          note_id: string
          updated_at?: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          embedding?: string | null
          household_id?: string
          note_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_embeddings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_embeddings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string | null
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          household_id: string
          id: string
          is_pinned: boolean
          owner_id: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["item_visibility"]
        }
        Insert: {
          body?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          household_id: string
          id?: string
          is_pinned?: boolean
          owner_id?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Update: {
          body?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_pinned?: boolean
          owner_id?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          account_number: string | null
          billing_cadence: Database["public"]["Enums"]["payment_cadence"]
          contact: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          created_by: string | null
          currency: string
          household_id: string
          id: string
          is_active: boolean
          login_ref: string | null
          monthly_cost: number | null
          name: string
          notes: string | null
          notice_days: number | null
          plan: string | null
          renewal_date: string | null
          type: Database["public"]["Enums"]["provider_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          billing_cadence?: Database["public"]["Enums"]["payment_cadence"]
          contact?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          household_id: string
          id?: string
          is_active?: boolean
          login_ref?: string | null
          monthly_cost?: number | null
          name: string
          notes?: string | null
          notice_days?: number | null
          plan?: string | null
          renewal_date?: string | null
          type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          billing_cadence?: Database["public"]["Enums"]["payment_cadence"]
          contact?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          household_id?: string
          id?: string
          is_active?: boolean
          login_ref?: string | null
          monthly_cost?: number | null
          name?: string
          notes?: string | null
          notice_days?: number | null
          plan?: string | null
          renewal_date?: string | null
          type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_payments: {
        Row: {
          amount: number
          asset_id: string | null
          cadence: Database["public"]["Enums"]["payment_cadence"]
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          household_id: string
          id: string
          interval: number
          is_active: boolean
          name: string
          next_due_on: string | null
          notes: string | null
          provider: string | null
          provider_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          asset_id?: string | null
          cadence?: Database["public"]["Enums"]["payment_cadence"]
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          household_id: string
          id?: string
          interval?: number
          is_active?: boolean
          name: string
          next_due_on?: string | null
          notes?: string | null
          provider?: string | null
          provider_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string | null
          cadence?: Database["public"]["Enums"]["payment_cadence"]
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          household_id?: string
          id?: string
          interval?: number
          is_active?: boolean
          name?: string
          next_due_on?: string | null
          notes?: string | null
          provider?: string | null
          provider_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_payments_asset_household_fkey"
            columns: ["asset_id", "household_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "recurring_payments_category_household_fkey"
            columns: ["category_id", "household_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "recurring_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payments_provider_household_fkey"
            columns: ["provider_id", "household_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "recurring_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          category: string | null
          checked_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          household_id: string
          id: string
          is_checked: boolean
          list_id: string
          name: string
          quantity: number
          sort_order: number
          store: string | null
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          checked_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          household_id: string
          id?: string
          is_checked?: boolean
          list_id: string
          name: string
          quantity?: number
          sort_order?: number
          store?: string | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          checked_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_checked?: boolean
          list_id?: string
          name?: string
          quantity?: number
          sort_order?: number
          store?: string | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_list_household_fkey"
            columns: ["list_id", "household_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "shopping_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          created_by: string | null
          default_store: string | null
          household_id: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_store?: string | null
          household_id: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_store?: string | null
          household_id?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          done_at: string | null
          due_at: string | null
          household_id: string
          id: string
          is_done: boolean
          list_id: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          done_at?: string | null
          due_at?: string | null
          household_id: string
          id?: string
          is_done?: boolean
          list_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          done_at?: string | null
          due_at?: string | null
          household_id?: string
          id?: string
          is_done?: boolean
          list_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_list_household_fkey"
            columns: ["list_id", "household_id"]
            isOneToOne: false
            referencedRelation: "todo_lists"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_lists: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todo_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_lists_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          notif_email: boolean
          notif_push: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notif_email?: boolean
          notif_push?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notif_email?: boolean
          notif_push?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_household: {
        Args: { p_name?: string }
        Returns: {
          created_at: string
          currency: string
          id: string
          name: string
          owner_id: string
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_household_ids: { Args: never; Returns: string[] }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_owner: { Args: { hid: string }; Returns: boolean }
      seed_default_expense_categories: {
        Args: { p_household_id: string }
        Returns: undefined
      }
    }
    Enums: {
      asset_status: "active" | "inactive" | "archived"
      asset_type: "vehicle" | "property" | "other"
      category_kind: "expense" | "income"
      document_entity:
        | "asset"
        | "provider"
        | "expense"
        | "maintenance"
        | "recurring_payment"
        | "note"
        | "event"
        | "task"
        | "other"
      item_visibility: "personal" | "shared"
      member_role: "owner" | "member"
      payment_cadence:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly"
        | "custom"
      provider_type:
        | "internet"
        | "mobile"
        | "tv"
        | "utility"
        | "insurance"
        | "other"
      recurrence_freq: "none" | "daily" | "weekly" | "monthly" | "yearly"
      reminder_method: "push" | "email"
      task_priority: "low" | "normal" | "high" | "urgent"
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
      asset_status: ["active", "inactive", "archived"],
      asset_type: ["vehicle", "property", "other"],
      category_kind: ["expense", "income"],
      document_entity: [
        "asset",
        "provider",
        "expense",
        "maintenance",
        "recurring_payment",
        "note",
        "event",
        "task",
        "other",
      ],
      item_visibility: ["personal", "shared"],
      member_role: ["owner", "member"],
      payment_cadence: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
        "custom",
      ],
      provider_type: [
        "internet",
        "mobile",
        "tv",
        "utility",
        "insurance",
        "other",
      ],
      recurrence_freq: ["none", "daily", "weekly", "monthly", "yearly"],
      reminder_method: ["push", "email"],
      task_priority: ["low", "normal", "high", "urgent"],
    },
  },
} as const

