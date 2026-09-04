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
      agent_conversations: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          agent_name: string | null
          citations: Json
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          agent_name?: string | null
          citations?: Json
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          agent_name?: string | null
          citations?: Json
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent: string
          case_id: string | null
          confidence: number | null
          created_at: string
          id: string
          input: Json
          model_version: string | null
          output: Json
          requires_human_review: boolean
          sources: string[]
        }
        Insert: {
          agent: string
          case_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          input: Json
          model_version?: string | null
          output: Json
          requires_human_review?: boolean
          sources?: string[]
        }
        Update: {
          agent?: string
          case_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          input?: Json
          model_version?: string | null
          output?: Json
          requires_human_review?: boolean
          sources?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      application_pack_exports: {
        Row: {
          case_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          requested_by: string | null
          sha256: string | null
          status: string
          storage_path: string | null
        }
        Insert: {
          case_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          requested_by?: string | null
          sha256?: string | null
          status?: string
          storage_path?: string | null
        }
        Update: {
          case_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          requested_by?: string | null
          sha256?: string | null
          status?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      application_pack_files: {
        Row: {
          byte_size: number | null
          case_id: string
          export_id: string | null
          filename: string
          generated_at: string | null
          generated_by: string | null
          id: string
          mime_type: string
          sha256: string | null
          storage_path: string
        }
        Insert: {
          byte_size?: number | null
          case_id: string
          export_id?: string | null
          filename: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          mime_type?: string
          sha256?: string | null
          storage_path: string
        }
        Update: {
          byte_size?: number | null
          case_id?: string
          export_id?: string | null
          filename?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          mime_type?: string
          sha256?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      application_requirements: {
        Row: {
          evidence_item_id: string | null
          funding_application_id: string
          id: string
          label: string
          notes: string | null
          required: boolean
          requirement_key: string
          status: string
        }
        Insert: {
          evidence_item_id?: string | null
          funding_application_id: string
          id?: string
          label: string
          notes?: string | null
          required?: boolean
          requirement_key: string
          status?: string
        }
        Update: {
          evidence_item_id?: string | null
          funding_application_id?: string
          id?: string
          label?: string
          notes?: string | null
          required?: boolean
          requirement_key?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_requirements_evidence_item_id_fkey"
            columns: ["evidence_item_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_requirements_funding_application_id_fkey"
            columns: ["funding_application_id"]
            isOneToOne: false
            referencedRelation: "funding_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          case_id: string
          confidence: number | null
          created_at: string
          id: string
          requires_human_review: boolean
          result: Json
          type: string
        }
        Insert: {
          case_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          requires_human_review?: boolean
          result: Json
          type: string
        }
        Update: {
          case_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          requires_human_review?: boolean
          result?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_exports: {
        Row: {
          case_id: string | null
          completed_at: string | null
          created_at: string | null
          export_type: string
          id: string
          organisation_id: string | null
          requested_by: string
          sha256: string | null
          status: string
          storage_path: string | null
        }
        Insert: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          export_type: string
          id?: string
          organisation_id?: string | null
          requested_by: string
          sha256?: string | null
          status?: string
          storage_path?: string | null
        }
        Update: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          export_type?: string
          id?: string
          organisation_id?: string | null
          requested_by?: string
          sha256?: string | null
          status?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_type: string
          external_id: string
          id: string
          metadata: Json
          org_id: string | null
          provider: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          external_id: string
          id?: string
          metadata?: Json
          org_id?: string | null
          provider?: string
          status: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          external_id?: string
          id?: string
          metadata?: Json
          org_id?: string | null
          provider?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_assignments: {
        Row: {
          assigned_at: string | null
          assigned_user_id: string
          assignment_role: string
          case_id: string
          id: string
          released_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_user_id: string
          assignment_role?: string
          case_id: string
          id?: string
          released_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_user_id?: string
          assignment_role?: string
          case_id?: string
          id?: string
          released_at?: string | null
        }
        Relationships: []
      }
      case_documents: {
        Row: {
          byte_size: number | null
          case_id: string
          category: string
          created_at: string
          evidence_provider: string
          external_evidence_id: string | null
          filename: string
          id: string
          mime_type: string | null
          owner_id: string
          sha256: string | null
          storage_path: string
          verified_at: string | null
        }
        Insert: {
          byte_size?: number | null
          case_id: string
          category: string
          created_at?: string
          evidence_provider?: string
          external_evidence_id?: string | null
          filename: string
          id?: string
          mime_type?: string | null
          owner_id: string
          sha256?: string | null
          storage_path: string
          verified_at?: string | null
        }
        Update: {
          byte_size?: number | null
          case_id?: string
          category?: string
          created_at?: string
          evidence_provider?: string
          external_evidence_id?: string | null
          filename?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
          sha256?: string | null
          storage_path?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      case_financials: {
        Row: {
          approved_funding: number | null
          case_id: string
          committed_contract_value: number | null
          currency: string
          estimated_works: number | null
          id: string
          owner_contribution: number | null
          paid_to_date: number | null
          updated_at: string
        }
        Insert: {
          approved_funding?: number | null
          case_id: string
          committed_contract_value?: number | null
          currency?: string
          estimated_works?: number | null
          id?: string
          owner_contribution?: number | null
          paid_to_date?: number | null
          updated_at?: string
        }
        Update: {
          approved_funding?: number | null
          case_id?: string
          committed_contract_value?: number | null
          currency?: string
          estimated_works?: number | null
          id?: string
          owner_contribution?: number | null
          paid_to_date?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_financials_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_members: {
        Row: {
          case_id: string
          role: Database["public"]["Enums"]["case_role"]
          user_id: string
        }
        Insert: {
          case_id: string
          role: Database["public"]["Enums"]["case_role"]
          user_id: string
        }
        Update: {
          case_id?: string
          role?: Database["public"]["Enums"]["case_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_members_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          attachments: Json
          body: string
          case_id: string
          created_at: string | null
          id: string
          message_type: string
          read_at: string | null
          sender_id: string | null
          sender_role: string | null
        }
        Insert: {
          attachments?: Json
          body: string
          case_id: string
          created_at?: string | null
          id?: string
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sender_role?: string | null
        }
        Update: {
          attachments?: Json
          body?: string
          case_id?: string
          created_at?: string | null
          id?: string
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sender_role?: string | null
        }
        Relationships: []
      }
      case_status_events: {
        Row: {
          actor_user_id: string | null
          case_id: string
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          actor_user_id?: string | null
          case_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          actor_user_id?: string | null
          case_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_status_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tasks: {
        Row: {
          assigned_to: string | null
          blocking: boolean
          case_id: string
          created_at: string
          due_at: string | null
          id: string
          metadata: Json
          status: string
          task_type: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          blocking?: boolean
          case_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          metadata?: Json
          status?: string
          task_type: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          blocking?: boolean
          case_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          metadata?: Json
          status?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          created_at: string
          id: string
          owner_org_id: string | null
          property_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_org_id?: string | null
          property_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_org_id?: string | null
          property_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_log: {
        Row: {
          created_at: string
          granted: boolean
          id: number
          ip_hash: string | null
          policy_version: string
          purpose: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: never
          ip_hash?: string | null
          policy_version: string
          purpose: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: never
          ip_hash?: string | null
          policy_version?: string
          purpose?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contract_awards: {
        Row: {
          awarded_at: string | null
          case_id: string
          completion_due_at: string | null
          contract_value: number
          contractor_org_id: string | null
          created_at: string | null
          id: string
          quote_id: string
          quote_request_id: string
          status: string
        }
        Insert: {
          awarded_at?: string | null
          case_id: string
          completion_due_at?: string | null
          contract_value: number
          contractor_org_id?: string | null
          created_at?: string | null
          id?: string
          quote_id: string
          quote_request_id: string
          status?: string
        }
        Update: {
          awarded_at?: string | null
          case_id?: string
          completion_due_at?: string | null
          contract_value?: number
          contractor_org_id?: string | null
          created_at?: string | null
          id?: string
          quote_id?: string
          quote_request_id?: string
          status?: string
        }
        Relationships: []
      }
      contractor_profiles: {
        Row: {
          completed_projects: number
          coverage_outcodes: string[]
          craftvaro_external_id: string | null
          created_at: string
          gas_safe_number: string | null
          id: string
          niceic_number: string | null
          organisation_id: string
          professional_indemnity_verified: boolean
          public_liability_verified: boolean
          rating: number | null
          retrofit_accreditations: string[]
          trades: string[]
          updated_at: string
          verification_expires_at: string | null
          verified: boolean
        }
        Insert: {
          completed_projects?: number
          coverage_outcodes?: string[]
          craftvaro_external_id?: string | null
          created_at?: string
          gas_safe_number?: string | null
          id?: string
          niceic_number?: string | null
          organisation_id: string
          professional_indemnity_verified?: boolean
          public_liability_verified?: boolean
          rating?: number | null
          retrofit_accreditations?: string[]
          trades?: string[]
          updated_at?: string
          verification_expires_at?: string | null
          verified?: boolean
        }
        Update: {
          completed_projects?: number
          coverage_outcodes?: string[]
          craftvaro_external_id?: string | null
          created_at?: string
          gas_safe_number?: string | null
          id?: string
          niceic_number?: string | null
          organisation_id?: string
          professional_indemnity_verified?: boolean
          public_liability_verified?: boolean
          rating?: number | null
          retrofit_accreditations?: string[]
          trades?: string[]
          updated_at?: string
          verification_expires_at?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contractor_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      council_sources: {
        Row: {
          authority_code: string
          authority_name: string
          id: string
          last_checked_at: string | null
          last_success_at: string | null
          metadata: Json
          nation: string
          source_hash: string | null
          source_type: string
          source_url: string
          status: string
        }
        Insert: {
          authority_code: string
          authority_name: string
          id?: string
          last_checked_at?: string | null
          last_success_at?: string | null
          metadata?: Json
          nation: string
          source_hash?: string | null
          source_type: string
          source_url: string
          status?: string
        }
        Update: {
          authority_code?: string
          authority_name?: string
          id?: string
          last_checked_at?: string | null
          last_success_at?: string | null
          metadata?: Json
          nation?: string
          source_hash?: string | null
          source_type?: string
          source_url?: string
          status?: string
        }
        Relationships: []
      }
      council_targets: {
        Row: {
          carbon_improvement_target: number | null
          created_at: string | null
          funding_deployed_target: number | null
          homes_returned_target: number | null
          id: string
          organisation_id: string
          period_end: string
          period_start: string
        }
        Insert: {
          carbon_improvement_target?: number | null
          created_at?: string | null
          funding_deployed_target?: number | null
          homes_returned_target?: number | null
          id?: string
          organisation_id: string
          period_end: string
          period_start: string
        }
        Update: {
          carbon_improvement_target?: number | null
          created_at?: string | null
          funding_deployed_target?: number | null
          homes_returned_target?: number | null
          id?: string
          organisation_id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_at: string
          id: string
          request_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_at?: string
          id?: string
          request_type: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_at?: string
          id?: string
          request_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      evidence_items: {
        Row: {
          captured_at: string | null
          case_id: string
          external_dokuvera_id: string | null
          file_name: string | null
          id: string
          kind: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          sha256: string | null
          verified: boolean
        }
        Insert: {
          captured_at?: string | null
          case_id: string
          external_dokuvera_id?: string | null
          file_name?: string | null
          id?: string
          kind: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          sha256?: string | null
          verified?: boolean
        }
        Update: {
          captured_at?: string | null
          case_id?: string
          external_dokuvera_id?: string | null
          file_name?: string | null
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          sha256?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_allocations: {
        Row: {
          allocated_amount: number
          allocation_reason: string | null
          case_id: string
          created_at: string | null
          funding_scheme_id: string | null
          id: string
          status: string
          work_item_id: string
        }
        Insert: {
          allocated_amount: number
          allocation_reason?: string | null
          case_id: string
          created_at?: string | null
          funding_scheme_id?: string | null
          id?: string
          status?: string
          work_item_id: string
        }
        Update: {
          allocated_amount?: number
          allocation_reason?: string | null
          case_id?: string
          created_at?: string | null
          funding_scheme_id?: string | null
          id?: string
          status?: string
          work_item_id?: string
        }
        Relationships: []
      }
      funding_applications: {
        Row: {
          application_payload: Json
          awarded_amount: number | null
          case_id: string
          created_at: string
          decision_at: string | null
          decision_reason: string | null
          id: string
          requested_amount: number | null
          scheme_id: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          application_payload?: Json
          awarded_amount?: number | null
          case_id: string
          created_at?: string
          decision_at?: string | null
          decision_reason?: string | null
          id?: string
          requested_amount?: number | null
          scheme_id: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          application_payload?: Json
          awarded_amount?: number | null
          case_id?: string
          created_at?: string
          decision_at?: string | null
          decision_reason?: string | null
          id?: string
          requested_amount?: number | null
          scheme_id?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_applications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "funding_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_matches: {
        Row: {
          case_id: string
          confidence: number | null
          created_at: string
          eligible: boolean | null
          explanation: Json | null
          id: string
          scheme_id: string
        }
        Insert: {
          case_id: string
          confidence?: number | null
          created_at?: string
          eligible?: boolean | null
          explanation?: Json | null
          id?: string
          scheme_id: string
        }
        Update: {
          case_id?: string
          confidence?: number | null
          created_at?: string
          eligible?: boolean | null
          explanation?: Json | null
          id?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_matches_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_matches_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "funding_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_schemes: {
        Row: {
          authority: string
          created_at: string
          eligible_owner_types: string[]
          eligible_uses: string[]
          eligible_works: string[]
          geography: Json
          id: string
          max_amount: number | null
          min_empty_months: number | null
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          scheme_type: string | null
          source_id: string
          status: Database["public"]["Enums"]["review_status"]
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          authority: string
          created_at?: string
          eligible_owner_types?: string[]
          eligible_uses?: string[]
          eligible_works?: string[]
          geography?: Json
          id?: string
          max_amount?: number | null
          min_empty_months?: number | null
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheme_type?: string | null
          source_id: string
          status?: Database["public"]["Enums"]["review_status"]
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          authority?: string
          created_at?: string
          eligible_owner_types?: string[]
          eligible_uses?: string[]
          eligible_works?: string[]
          geography?: Json
          id?: string
          max_amount?: number | null
          min_empty_months?: number | null
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheme_type?: string | null
          source_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_schemes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_source_health: {
        Row: {
          consecutive_failures: number
          last_failure_at: string | null
          last_success_at: string | null
          metadata: Json
          source_key: string
          status: string
        }
        Insert: {
          consecutive_failures?: number
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json
          source_key: string
          status?: string
        }
        Update: {
          consecutive_failures?: number
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json
          source_key?: string
          status?: string
        }
        Relationships: []
      }
      funding_work_items: {
        Row: {
          case_id: string
          category: string
          code: string
          created_at: string | null
          description: string
          estimated_cost: number
          id: string
        }
        Insert: {
          case_id: string
          category: string
          code: string
          created_at?: string | null
          description: string
          estimated_cost?: number
          id?: string
        }
        Update: {
          case_id?: string
          category?: string
          code?: string
          created_at?: string | null
          description?: string
          estimated_cost?: number
          id?: string
        }
        Relationships: []
      }
      incident_records: {
        Row: {
          details: Json
          detected_at: string | null
          id: string
          incident_type: string
          resolved_at: string | null
          severity: string
          status: string
          summary: string
        }
        Insert: {
          details?: Json
          detected_at?: string | null
          id?: string
          incident_type: string
          resolved_at?: string | null
          severity: string
          status?: string
          summary: string
        }
        Update: {
          details?: Json
          detected_at?: string | null
          id?: string
          incident_type?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          summary?: string
        }
        Relationships: []
      }
      integration_accounts: {
        Row: {
          created_at: string
          external_org_id: string
          id: string
          metadata: Json
          org_id: string
          provider: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          external_org_id: string
          id?: string
          metadata?: Json
          org_id: string
          provider: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          external_org_id?: string
          id?: string
          metadata?: Json
          org_id?: string
          provider?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          case_id: string | null
          created_at: string
          error: string | null
          event_type: string
          external_id: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          error?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          error?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_idempotency: {
        Row: {
          event_id: string
          key: string
          outcome: Json | null
          processed_at: string | null
          provider: string
          received_at: string
        }
        Insert: {
          event_id: string
          key: string
          outcome?: Json | null
          processed_at?: string | null
          provider: string
          received_at?: string
        }
        Update: {
          event_id?: string
          key?: string
          outcome?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
      integration_jobs: {
        Row: {
          attempts: number
          case_id: string | null
          created_at: string | null
          id: string
          integration: string
          job_type: string
          last_error: string | null
          next_attempt_at: string | null
          request_payload: Json
          response_payload: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          case_id?: string | null
          created_at?: string | null
          id?: string
          integration: string
          job_type: string
          last_error?: string | null
          next_attempt_at?: string | null
          request_payload?: Json
          response_payload?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          case_id?: string | null
          created_at?: string | null
          id?: string
          integration?: string
          job_type?: string
          last_error?: string | null
          next_attempt_at?: string | null
          request_payload?: Json
          response_payload?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_outcomes: {
        Row: {
          case_id: string
          event: string
          features: Json
          id: string
          occurred_at: string
          target: number | null
        }
        Insert: {
          case_id: string
          event: string
          features: Json
          id?: string
          occurred_at?: string
          target?: number | null
        }
        Update: {
          case_id?: string
          event?: string
          features?: Json
          id?: string
          occurred_at?: string
          target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_weights: {
        Row: {
          feature: string
          id: string
          sample_size: number
          scope: string
          updated_at: string
          weight: number
        }
        Insert: {
          feature: string
          id?: string
          sample_size?: number
          scope: string
          updated_at?: string
          weight?: number
        }
        Update: {
          feature?: string
          id?: string
          sample_size?: number
          scope?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          error: string | null
          id: string
          notification_type: string
          provider_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          notification_type: string
          provider_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          notification_type?: string
          provider_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email: boolean | null
          funding_changes: boolean | null
          project_updates: boolean | null
          push: boolean | null
          quote_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email?: boolean | null
          funding_changes?: boolean | null
          project_updates?: boolean | null
          push?: boolean | null
          quote_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          email?: boolean | null
          funding_changes?: boolean | null
          project_updates?: boolean | null
          push?: boolean | null
          quote_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          case_id: string | null
          channel: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          case_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          case_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      occupancy_outcomes: {
        Row: {
          affordable_home: boolean
          bedrooms_returned: number | null
          case_id: string
          id: string
          notes: string | null
          occupied_at: string | null
          outcome: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          affordable_home?: boolean
          bedrooms_returned?: number | null
          case_id: string
          id?: string
          notes?: string | null
          occupied_at?: string | null
          outcome: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          affordable_home?: boolean
          bedrooms_returned?: number | null
          case_id?: string
          id?: string
          notes?: string | null
          occupied_at?: string | null
          outcome?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_outcomes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          org_id: string
          role: Database["public"]["Enums"]["case_role"]
          user_id: string
        }
        Insert: {
          org_id: string
          role: Database["public"]["Enums"]["case_role"]
          user_id: string
        }
        Update: {
          org_id?: string
          role?: Database["public"]["Enums"]["case_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          due_at: string | null
          evidence_required: string[]
          id: string
          name: string
          project_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          due_at?: string | null
          evidence_required?: string[]
          id?: string
          name: string
          project_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          due_at?: string | null
          evidence_required?: string[]
          id?: string
          name?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          case_id: string
          contractor_org_id: string | null
          created_at: string
          id: string
          start_date: string | null
          status: string
          target_completion: string | null
        }
        Insert: {
          budget?: number | null
          case_id: string
          contractor_org_id?: string | null
          created_at?: string
          id?: string
          start_date?: string | null
          status?: string
          target_completion?: string | null
        }
        Update: {
          budget?: number | null
          case_id?: string
          contractor_org_id?: string | null
          created_at?: string
          id?: string
          start_date?: string | null
          status?: string
          target_completion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contractor_org_id_fkey"
            columns: ["contractor_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address_line: string | null
          created_at: string
          created_by: string
          empty_since: string | null
          id: string
          intended_use: string | null
          owner_type: string | null
          postcode: string
          status: string
        }
        Insert: {
          address_line?: string | null
          created_at?: string
          created_by: string
          empty_since?: string | null
          id?: string
          intended_use?: string | null
          owner_type?: string | null
          postcode: string
          status?: string
        }
        Update: {
          address_line?: string | null
          created_at?: string
          created_by?: string
          empty_since?: string | null
          id?: string
          intended_use?: string | null
          owner_type?: string | null
          postcode?: string
          status?: string
        }
        Relationships: []
      }
      property_answers: {
        Row: {
          answer: Json
          case_id: string
          created_at: string
          created_by: string | null
          id: string
          question_key: string
          source: string
          updated_at: string
        }
        Insert: {
          answer?: Json
          case_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          question_key: string
          source?: string
          updated_at?: string
        }
        Update: {
          answer?: Json
          case_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          question_key?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_answers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_offer_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_type: string
          id: string
          offer_id: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          offer_id: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          offer_id?: string
          payload?: Json
        }
        Relationships: []
      }
      provider_offers: {
        Row: {
          created_at: string | null
          headline_terms: Json
          id: string
          offer_type: string
          opportunity_id: string
          provider_org_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          headline_terms?: Json
          id?: string
          offer_type: string
          opportunity_id: string
          provider_org_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          headline_terms?: Json
          id?: string
          offer_type?: string
          opportunity_id?: string
          provider_org_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_opportunities: {
        Row: {
          case_id: string
          created_at: string
          id: string
          provider_org_id: string | null
          rationale: Json
          route: string
          score: number | null
          status: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          provider_org_id?: string | null
          rationale?: Json
          route: string
          score?: number | null
          status?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          provider_org_id?: string | null
          rationale?: Json
          route?: string
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_opportunities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_opportunities_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_responses: {
        Row: {
          created_at: string
          id: string
          note: string | null
          opportunity_id: string
          provider_org_id: string
          responder_id: string
          response: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          opportunity_id: string
          provider_org_id: string
          responder_id: string
          response: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          opportunity_id?: string
          provider_org_id?: string
          responder_id?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_responses_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "provider_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_responses_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          case_id: string
          created_at: string
          id: string
          status: string
          work_scope: Json
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          status?: string
          work_scope: Json
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          status?: string
          work_scope?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount: number | null
          contractor_org_id: string | null
          created_at: string
          details: Json
          external_craftvaro_id: string | null
          id: string
          quote_request_id: string | null
          status: string
        }
        Insert: {
          amount?: number | null
          contractor_org_id?: string | null
          created_at?: string
          details?: Json
          external_craftvaro_id?: string | null
          id?: string
          quote_request_id?: string | null
          status?: string
        }
        Update: {
          amount?: number | null
          contractor_org_id?: string | null
          created_at?: string
          details?: Json
          external_craftvaro_id?: string | null
          id?: string
          quote_request_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_contractor_org_id_fkey"
            columns: ["contractor_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      release_acceptance_runs: {
        Row: {
          checks: Json
          completed_at: string | null
          environment: string
          id: string
          release_version: string
          started_at: string | null
          status: string
        }
        Insert: {
          checks?: Json
          completed_at?: string | null
          environment: string
          id?: string
          release_version: string
          started_at?: string | null
          status?: string
        }
        Update: {
          checks?: Json
          completed_at?: string | null
          environment?: string
          id?: string
          release_version?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      risk_register: {
        Row: {
          created_at: string | null
          id: string
          likelihood: string
          mitigation: string | null
          owner_user_id: string | null
          scope: string
          scope_id: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          likelihood?: string
          mitigation?: string | null
          owner_user_id?: string | null
          scope: string
          scope_id?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          likelihood?: string
          mitigation?: string | null
          owner_user_id?: string | null
          scope?: string
          scope_id?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rule_change_queue: {
        Row: {
          before: Json | null
          change_type: string
          confidence: number | null
          created_at: string
          id: string
          proposed: Json
          reviewed_at: string | null
          reviewed_by: string | null
          scheme_id: string | null
          source_id: string
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          before?: Json | null
          change_type: string
          confidence?: number | null
          created_at?: string
          id?: string
          proposed: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheme_id?: string | null
          source_id: string
          status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          before?: Json | null
          change_type?: string
          confidence?: number | null
          created_at?: string
          id?: string
          proposed?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheme_id?: string | null
          source_id?: string
          status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rule_change_queue_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "funding_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_change_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      scheme_ingestion_runs: {
        Row: {
          changed_count: number
          discovered_count: number
          error: string | null
          finished_at: string | null
          id: string
          review_required_count: number
          source_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          changed_count?: number
          discovered_count?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          review_required_count?: number
          source_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          changed_count?: number
          discovered_count?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          review_required_count?: number
          source_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          severity: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          severity?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          severity?: string
        }
        Relationships: []
      }
      source_records: {
        Row: {
          confidence: number | null
          id: string
          last_checked_at: string | null
          raw: Json
          source_hash: string | null
          source_system: string
          source_url: string
        }
        Insert: {
          confidence?: number | null
          id?: string
          last_checked_at?: string | null
          raw?: Json
          source_hash?: string | null
          source_system: string
          source_url: string
        }
        Update: {
          confidence?: number | null
          id?: string
          last_checked_at?: string | null
          raw?: Json
          source_hash?: string | null
          source_system?: string
          source_url?: string
        }
        Relationships: []
      }
      subscription_entitlements: {
        Row: {
          entitlement_key: string
          id: string
          metadata: Json
          organisation_id: string | null
          plan_key: string
          source: string
          status: string
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          entitlement_key: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
          plan_key: string
          source?: string
          status?: string
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          entitlement_key?: string
          id?: string
          metadata?: Json
          organisation_id?: string | null
          plan_key?: string
          source?: string
          status?: string
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          org_id: string
          role: Database["public"]["Enums"]["case_role"]
          user_id: string
        }
        Insert: {
          org_id: string
          role: Database["public"]["Enums"]["case_role"]
          user_id: string
        }
        Update: {
          org_id?: string
          role?: Database["public"]["Enums"]["case_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_case: { Args: { target_case: string }; Returns: boolean }
      has_role: {
        Args: { target: Database["public"]["Enums"]["case_role"] }
        Returns: boolean
      }
      is_case_manager: { Args: { target_case: string }; Returns: boolean }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
    }
    Enums: {
      case_role:
        | "owner"
        | "investor"
        | "contractor"
        | "surveyor"
        | "housing_provider"
        | "council_officer"
        | "admin"
      review_status: "draft" | "reviewed" | "rejected" | "retired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      case_role: [
        "owner",
        "investor",
        "contractor",
        "surveyor",
        "housing_provider",
        "council_officer",
        "admin",
      ],
      review_status: ["draft", "reviewed", "rejected", "retired"],
    },
  },
} as const
