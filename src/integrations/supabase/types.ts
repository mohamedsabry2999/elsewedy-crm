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
      activities: {
        Row: {
          activity_type: string
          body: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          lead_id: string | null
          subject: string | null
        }
        Insert: {
          activity_type: string
          body?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          subject?: string | null
        }
        Update: {
          activity_type?: string
          body?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approver: string | null
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          id: string
          reason: string | null
          related_id: string | null
          related_table: string | null
          request_type: string
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approver?: string | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          id?: string
          reason?: string | null
          related_id?: string | null
          related_table?: string | null
          request_type: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approver?: string | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          id?: string
          reason?: string | null
          related_id?: string | null
          related_table?: string | null
          request_type?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          status: Database["public"]["Enums"]["automation_status"]
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          budget: number
          created_at: string
          created_by: string | null
          deals_closed: number
          end_date: string | null
          id: string
          leads_generated: number
          name: string
          notes: string | null
          owner_id: string | null
          platform: Database["public"]["Enums"]["campaign_platform"]
          revenue: number
          spent: number
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_sector: string | null
          target_service: string | null
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          created_by?: string | null
          deals_closed?: number
          end_date?: string | null
          id?: string
          leads_generated?: number
          name: string
          notes?: string | null
          owner_id?: string | null
          platform?: Database["public"]["Enums"]["campaign_platform"]
          revenue?: number
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_sector?: string | null
          target_service?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          created_by?: string | null
          deals_closed?: number
          end_date?: string | null
          id?: string
          leads_generated?: number
          name?: string
          notes?: string | null
          owner_id?: string | null
          platform?: Database["public"]["Enums"]["campaign_platform"]
          revenue?: number
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_sector?: string | null
          target_service?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          assigned_to: string | null
          city: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_order_date: string | null
          notes: string | null
          phone: string | null
          sector: string | null
          tags: string[]
          total_revenue: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_order_date?: string | null
          notes?: string | null
          phone?: string | null
          sector?: string | null
          tags?: string[]
          total_revenue?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_order_date?: string | null
          notes?: string | null
          phone?: string | null
          sector?: string | null
          tags?: string[]
          total_revenue?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      competitors: {
        Row: {
          advantage: string | null
          client_id: string | null
          competitor_price: number | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          name: string
          notes: string | null
          outcome: string | null
          reason: string | null
          service: string | null
          updated_at: string
        }
        Insert: {
          advantage?: string | null
          client_id?: string | null
          competitor_price?: number | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          name: string
          notes?: string | null
          outcome?: string | null
          reason?: string | null
          service?: string | null
          updated_at?: string
        }
        Update: {
          advantage?: string | null
          client_id?: string | null
          competitor_price?: number | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          outcome?: string | null
          reason?: string | null
          service?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitors_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          complaint_number: string | null
          complaint_type: Database["public"]["Enums"]["complaint_type"]
          created_at: string
          created_by: string | null
          description: string | null
          escalated_at: string | null
          id: string
          order_id: string | null
          resolution: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["complaint_severity"]
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          complaint_number?: string | null
          complaint_type?: Database["public"]["Enums"]["complaint_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalated_at?: string | null
          id?: string
          order_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["complaint_severity"]
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          complaint_number?: string | null
          complaint_type?: Database["public"]["Enums"]["complaint_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalated_at?: string | null
          id?: string
          order_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["complaint_severity"]
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          next_followup_date: string | null
          notes: string | null
          owner_id: string | null
          service: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          next_followup_date?: string | null
          notes?: string | null
          owner_id?: string | null
          service?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          next_followup_date?: string | null
          notes?: string | null
          owner_id?: string | null
          service?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          address: string | null
          city: string | null
          client_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          delivery_number: string | null
          driver: string | null
          id: string
          method: string | null
          notes: string | null
          order_id: string | null
          phone: string | null
          proof_url: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          delivery_number?: string | null
          driver?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          order_id?: string | null
          phone?: string | null
          proof_url?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          client_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          delivery_number?: string | null
          driver?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          order_id?: string | null
          phone?: string | null
          proof_url?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          created_ids: Json
          error_count: number
          errors: Json
          file_name: string
          id: string
          inserted_count: number
          mapping: Json
          skipped_count: number
          status: string
          target_module: string
          total_rows: number
          updated_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          created_ids?: Json
          error_count?: number
          errors?: Json
          file_name: string
          id?: string
          inserted_count?: number
          mapping?: Json
          skipped_count?: number
          status?: string
          target_module: string
          total_rows?: number
          updated_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          created_ids?: Json
          error_count?: number
          errors?: Json
          file_name?: string
          id?: string
          inserted_count?: number
          mapping?: Json
          skipped_count?: number
          status?: string
          target_module?: string
          total_rows?: number
          updated_count?: number
          user_id?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          city: string | null
          client_id: string | null
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_contact_date: string | null
          id: string
          next_followup_date: string | null
          notes: string | null
          phone: string | null
          sector: string | null
          service: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          city?: string | null
          client_id?: string | null
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_contact_date?: string | null
          id?: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          sector?: string | null
          service?: string | null
          source: string
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          city?: string | null
          client_id?: string | null
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_contact_date?: string | null
          id?: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          sector?: string | null
          service?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reports: {
        Row: {
          budget: number | null
          client_id: string | null
          client_needs: string | null
          competitors_mentioned: string | null
          created_at: string
          created_by: string | null
          discussed_services: string | null
          id: string
          meeting_date: string
          meeting_type: string | null
          next_action: string | null
          next_followup: string | null
          notes: string | null
          probability: number | null
          purpose: string | null
          sales_owner: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          client_needs?: string | null
          competitors_mentioned?: string | null
          created_at?: string
          created_by?: string | null
          discussed_services?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string | null
          next_action?: string | null
          next_followup?: string | null
          notes?: string | null
          probability?: number | null
          purpose?: string | null
          sales_owner?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          client_needs?: string | null
          competitors_mentioned?: string | null
          created_at?: string
          created_by?: string | null
          discussed_services?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string | null
          next_action?: string | null
          next_followup?: string | null
          notes?: string | null
          probability?: number | null
          purpose?: string | null
          sales_owner?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          link: string | null
          read_at: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          delivery_address: string | null
          delivery_date: string | null
          id: string
          order_number: string | null
          owner_id: string | null
          paid_amount: number
          production_notes: string | null
          quotation_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          order_number?: string | null
          owner_id?: string | null
          paid_amount?: number
          production_notes?: string | null
          quotation_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          order_number?: string | null
          owner_id?: string | null
          paid_amount?: number
          production_notes?: string | null
          quotation_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          client_id: string | null
          collection_owner: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string | null
          id: string
          method: string | null
          notes: string | null
          order_id: string | null
          paid_amount: number
          quotation_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          collection_owner?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          order_id?: string | null
          paid_amount?: number
          quotation_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          collection_owner?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          order_id?: string | null
          paid_amount?: number
          quotation_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_tokens: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_requests: {
        Row: {
          artwork_url: string | null
          client_id: string | null
          colors: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deal_id: string | null
          delivery_date: string | null
          final_price: number | null
          finishing: string | null
          id: string
          internal_notes: string | null
          material: string | null
          priced_at: string | null
          priced_by: string | null
          pricing_notes: string | null
          pricing_owner: string | null
          printing_type: string | null
          product_type: string | null
          quantity: number | null
          quotation_id: string | null
          request_number: string | null
          sales_owner: string | null
          sample_required: boolean | null
          service_type: string | null
          size: string | null
          status: string
          technical_notes: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          artwork_url?: string | null
          client_id?: string | null
          colors?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          delivery_date?: string | null
          final_price?: number | null
          finishing?: string | null
          id?: string
          internal_notes?: string | null
          material?: string | null
          priced_at?: string | null
          priced_by?: string | null
          pricing_notes?: string | null
          pricing_owner?: string | null
          printing_type?: string | null
          product_type?: string | null
          quantity?: number | null
          quotation_id?: string | null
          request_number?: string | null
          sales_owner?: string | null
          sample_required?: boolean | null
          service_type?: string | null
          size?: string | null
          status?: string
          technical_notes?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          artwork_url?: string | null
          client_id?: string | null
          colors?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          delivery_date?: string | null
          final_price?: number | null
          finishing?: string | null
          id?: string
          internal_notes?: string | null
          material?: string | null
          priced_at?: string | null
          priced_by?: string | null
          pricing_notes?: string | null
          pricing_owner?: string | null
          printing_type?: string | null
          product_type?: string | null
          quantity?: number | null
          quotation_id?: string | null
          request_number?: string | null
          sales_owner?: string | null
          sample_required?: boolean | null
          service_type?: string | null
          size?: string | null
          status?: string
          technical_notes?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_requests_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_stages: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          stage_name: string
          stage_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["production_stage_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          stage_name: string
          stage_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["production_stage_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          stage_name?: string
          stage_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["production_stage_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_stages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string
          discount_pct: number
          id: string
          quantity: number
          quotation_id: string
          sort_order: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          quantity?: number
          quotation_id: string
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          quantity?: number
          quotation_id?: string
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          approved_at: string | null
          artwork_url: string | null
          client_id: string | null
          colors: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          delivery_date: string | null
          discount: number
          final_price: number
          finishing: string[] | null
          id: string
          material: string | null
          owner_id: string | null
          payment_terms: string | null
          pricing_notes: string | null
          printing_type: string | null
          product_type: string | null
          quantity: number | null
          quote_number: string | null
          sample_required: boolean | null
          sent_at: string | null
          service_type: string | null
          size: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          technical_notes: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string
          validity_days: number
          vat_amount: number
        }
        Insert: {
          approved_at?: string | null
          artwork_url?: string | null
          client_id?: string | null
          colors?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          delivery_date?: string | null
          discount?: number
          final_price?: number
          finishing?: string[] | null
          id?: string
          material?: string | null
          owner_id?: string | null
          payment_terms?: string | null
          pricing_notes?: string | null
          printing_type?: string | null
          product_type?: string | null
          quantity?: number | null
          quote_number?: string | null
          sample_required?: boolean | null
          sent_at?: string | null
          service_type?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          technical_notes?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
          validity_days?: number
          vat_amount?: number
        }
        Update: {
          approved_at?: string | null
          artwork_url?: string | null
          client_id?: string | null
          colors?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          delivery_date?: string | null
          discount?: number
          final_price?: number
          finishing?: string[] | null
          id?: string
          material?: string | null
          owner_id?: string | null
          payment_terms?: string | null
          pricing_notes?: string | null
          printing_type?: string | null
          product_type?: string | null
          quantity?: number | null
          quote_number?: string | null
          sample_required?: boolean | null
          sent_at?: string | null
          service_type?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          technical_notes?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
          validity_days?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          client_feedback: string | null
          client_id: string | null
          converted_to_order: boolean | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          delivered_at: string | null
          description: string | null
          id: string
          notes: string | null
          produced_at: string | null
          product_type: string | null
          requested_at: string | null
          sample_number: string | null
          service_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_feedback?: string | null
          client_id?: string | null
          converted_to_order?: boolean | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          delivered_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          produced_at?: string | null
          product_type?: string | null
          requested_at?: string | null
          sample_number?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_feedback?: string | null
          client_id?: string | null
          converted_to_order?: boolean | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          delivered_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          produced_at?: string | null
          product_type?: string | null
          requested_at?: string | null
          sample_number?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
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
      app_role:
        | "super_admin"
        | "top_management"
        | "marketing_manager"
        | "sales_manager"
        | "sales_person"
        | "pricing_team"
        | "production_planning"
        | "accounting"
        | "customer_service"
        | "viewer"
      automation_status: "active" | "paused" | "draft"
      campaign_platform:
        | "meta"
        | "google"
        | "linkedin"
        | "email"
        | "whatsapp"
        | "seo"
        | "exhibition"
        | "other"
      campaign_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      client_type: "new" | "repeat" | "vip" | "dormant"
      complaint_severity: "low" | "medium" | "high" | "critical"
      complaint_status:
        | "open"
        | "investigating"
        | "resolved"
        | "escalated"
        | "closed"
      complaint_type:
        | "delay"
        | "color_mismatch"
        | "material"
        | "finishing"
        | "quantity_shortage"
        | "damage"
        | "other"
      deal_stage:
        | "new_lead"
        | "contacted"
        | "qualified"
        | "need_analysis"
        | "sample_review"
        | "quotation_requested"
        | "quotation_sent"
        | "follow_up"
        | "negotiation"
        | "won"
        | "lost"
        | "dormant"
        | "reorder"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "converted"
        | "lost"
      lead_temperature: "hot" | "warm" | "cold"
      order_status:
        | "new"
        | "in_production"
        | "quality_check"
        | "packaging"
        | "ready"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "on_hold"
      production_stage_status:
        | "pending"
        | "in_progress"
        | "done"
        | "blocked"
        | "skipped"
      quotation_status:
        | "draft"
        | "waiting_pricing"
        | "sent"
        | "viewed"
        | "follow_up"
        | "approved"
        | "rejected"
        | "expired"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
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
      app_role: [
        "super_admin",
        "top_management",
        "marketing_manager",
        "sales_manager",
        "sales_person",
        "pricing_team",
        "production_planning",
        "accounting",
        "customer_service",
        "viewer",
      ],
      automation_status: ["active", "paused", "draft"],
      campaign_platform: [
        "meta",
        "google",
        "linkedin",
        "email",
        "whatsapp",
        "seo",
        "exhibition",
        "other",
      ],
      campaign_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      client_type: ["new", "repeat", "vip", "dormant"],
      complaint_severity: ["low", "medium", "high", "critical"],
      complaint_status: [
        "open",
        "investigating",
        "resolved",
        "escalated",
        "closed",
      ],
      complaint_type: [
        "delay",
        "color_mismatch",
        "material",
        "finishing",
        "quantity_shortage",
        "damage",
        "other",
      ],
      deal_stage: [
        "new_lead",
        "contacted",
        "qualified",
        "need_analysis",
        "sample_review",
        "quotation_requested",
        "quotation_sent",
        "follow_up",
        "negotiation",
        "won",
        "lost",
        "dormant",
        "reorder",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "unqualified",
        "converted",
        "lost",
      ],
      lead_temperature: ["hot", "warm", "cold"],
      order_status: [
        "new",
        "in_production",
        "quality_check",
        "packaging",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "on_hold",
      ],
      production_stage_status: [
        "pending",
        "in_progress",
        "done",
        "blocked",
        "skipped",
      ],
      quotation_status: [
        "draft",
        "waiting_pricing",
        "sent",
        "viewed",
        "follow_up",
        "approved",
        "rejected",
        "expired",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
