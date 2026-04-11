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
      age_groups: {
        Row: {
          id: string
          label_key: string
          max_age: number
          min_age: number
        }
        Insert: {
          id?: string
          label_key: string
          max_age: number
          min_age: number
        }
        Update: {
          id?: string
          label_key?: string
          max_age?: number
          min_age?: number
        }
        Relationships: []
      }
      automation_recovery_actions: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          decision: string
          decision_reason: string | null
          id: string
          idempotency_key: string
          invoked_run_id: string | null
          paperclip_invoke_status: number | null
          paperclip_resume_status: number | null
          reason: string | null
          request_metadata: Json
          requested_by_agent_id: string
          target_agent_id: string
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          decision: string
          decision_reason?: string | null
          id?: string
          idempotency_key: string
          invoked_run_id?: string | null
          paperclip_invoke_status?: number | null
          paperclip_resume_status?: number | null
          reason?: string | null
          request_metadata?: Json
          requested_by_agent_id: string
          target_agent_id: string
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          decision?: string
          decision_reason?: string | null
          id?: string
          idempotency_key?: string
          invoked_run_id?: string | null
          paperclip_invoke_status?: number | null
          paperclip_resume_status?: number | null
          reason?: string | null
          request_metadata?: Json
          requested_by_agent_id?: string
          target_agent_id?: string
        }
        Relationships: []
      }
      child_game_summaries: {
        Row: {
          best_score: number
          best_stars: number
          child_id: string
          game_id: string
          last_played_at: string | null
          total_attempts: number
          total_sessions: number
          updated_at: string
        }
        Insert: {
          best_score?: number
          best_stars?: number
          child_id: string
          game_id: string
          last_played_at?: string | null
          total_attempts?: number
          total_sessions?: number
          updated_at?: string
        }
        Update: {
          best_score?: number
          best_stars?: number
          child_id?: string
          game_id?: string
          last_played_at?: string | null
          total_attempts?: number
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_game_summaries_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_game_summaries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      child_handbook_progress: {
        Row: {
          child_id: string
          completed: boolean
          created_at: string
          furthest_page_number: number
          handbook_id: string
          id: string
          last_opened_at: string
          page_completion_json: Json
          updated_at: string
        }
        Insert: {
          child_id: string
          completed?: boolean
          created_at?: string
          furthest_page_number?: number
          handbook_id: string
          id?: string
          last_opened_at?: string
          page_completion_json?: Json
          updated_at?: string
        }
        Update: {
          child_id?: string
          completed?: boolean
          created_at?: string
          furthest_page_number?: number
          handbook_id?: string
          id?: string
          last_opened_at?: string
          page_completion_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_handbook_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_handbook_progress_handbook_id_fkey"
            columns: ["handbook_id"]
            isOneToOne: false
            referencedRelation: "handbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar: string | null
          birth_date: string | null
          created_at: string | null
          family_id: string
          id: string
          name: string
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          birth_date?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          name: string
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          birth_date?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          name?: string
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          auth_user_id: string
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      game_attempts: {
        Row: {
          age_band: string | null
          attempt_index: number
          child_id: string
          created_at: string
          difficulty_profile_id: string | null
          duration_ms: number | null
          game_id: string
          id: string
          in_support_mode: boolean
          level_id: string | null
          mastery_outcome: string | null
          payload: Json
          pm_accuracy_pct: number | null
          pm_age_band: string | null
          pm_contract_version: string | null
          pm_decode_accuracy_pct: number | null
          pm_domain: string | null
          pm_gate_passed: boolean | null
          pm_hint_trend: string | null
          pm_independence_trend: string | null
          pm_listen_participation_pct: number | null
          pm_progression_band: string | null
          pm_sequence_evidence_score: number | null
          pm_skill_key: string | null
          score: number
          session_id: string
          stars: number
          starting_level_id: string | null
          support_flags: Json
          updated_at: string
        }
        Insert: {
          age_band?: string | null
          attempt_index?: number
          child_id: string
          created_at?: string
          difficulty_profile_id?: string | null
          duration_ms?: number | null
          game_id: string
          id?: string
          in_support_mode?: boolean
          level_id?: string | null
          mastery_outcome?: string | null
          payload?: Json
          pm_accuracy_pct?: number | null
          pm_age_band?: string | null
          pm_contract_version?: string | null
          pm_decode_accuracy_pct?: number | null
          pm_domain?: string | null
          pm_gate_passed?: boolean | null
          pm_hint_trend?: string | null
          pm_independence_trend?: string | null
          pm_listen_participation_pct?: number | null
          pm_progression_band?: string | null
          pm_sequence_evidence_score?: number | null
          pm_skill_key?: string | null
          score?: number
          session_id: string
          stars?: number
          starting_level_id?: string | null
          support_flags?: Json
          updated_at?: string
        }
        Update: {
          age_band?: string | null
          attempt_index?: number
          child_id?: string
          created_at?: string
          difficulty_profile_id?: string | null
          duration_ms?: number | null
          game_id?: string
          id?: string
          in_support_mode?: boolean
          level_id?: string | null
          mastery_outcome?: string | null
          payload?: Json
          pm_accuracy_pct?: number | null
          pm_age_band?: string | null
          pm_contract_version?: string | null
          pm_decode_accuracy_pct?: number | null
          pm_domain?: string | null
          pm_gate_passed?: boolean | null
          pm_hint_trend?: string | null
          pm_independence_trend?: string | null
          pm_listen_participation_pct?: number | null
          pm_progression_band?: string | null
          pm_sequence_evidence_score?: number | null
          pm_skill_key?: string | null
          score?: number
          session_id?: string
          stars?: number
          starting_level_id?: string | null
          support_flags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_difficulty_profile_id_fkey"
            columns: ["difficulty_profile_id"]
            isOneToOne: false
            referencedRelation: "game_difficulty_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_starting_level_id_fkey"
            columns: ["starting_level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      game_difficulty_profiles: {
        Row: {
          age_band: string
          config_json: Json
          created_at: string
          game_id: string
          id: string
          is_published: boolean
          profile_version: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          age_band: string
          config_json?: Json
          created_at?: string
          game_id: string
          id?: string
          is_published?: boolean
          profile_version?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          age_band?: string
          config_json?: Json
          created_at?: string
          game_id?: string
          id?: string
          is_published?: boolean
          profile_version?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_difficulty_profiles_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_levels: {
        Row: {
          config_json: Json | null
          game_id: string
          id: string
          level_number: number
          sort_order: number | null
        }
        Insert: {
          config_json?: Json | null
          game_id: string
          id?: string
          level_number: number
          sort_order?: number | null
        }
        Update: {
          config_json?: Json | null
          game_id?: string
          id?: string
          level_number?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_levels_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          child_id: string
          client_session_id: string | null
          created_at: string
          device_info: Json
          ended_at: string | null
          game_id: string
          id: string
          started_at: string
        }
        Insert: {
          child_id: string
          client_session_id?: string | null
          created_at?: string
          device_info?: Json
          ended_at?: string | null
          game_id: string
          id?: string
          started_at?: string
        }
        Update: {
          child_id?: string
          client_session_id?: string | null
          created_at?: string
          device_info?: Json
          ended_at?: string | null
          game_id?: string
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_tag_assignments: {
        Row: {
          assignment_role: string
          created_at: string
          game_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assignment_role: string
          created_at?: string
          game_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assignment_role?: string
          created_at?: string
          game_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_tag_assignments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          age_group_id: string
          audio_url: string | null
          component_key: string
          created_at: string | null
          curriculum_domain: string | null
          description_key: string | null
          difficulty: number | null
          game_type: string
          id: string
          is_published: boolean | null
          name_key: string
          slug: string
          sort_order: number | null
          thumbnail_url: string | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          age_group_id: string
          audio_url?: string | null
          component_key: string
          created_at?: string | null
          curriculum_domain?: string | null
          description_key?: string | null
          difficulty?: number | null
          game_type: string
          id?: string
          is_published?: boolean | null
          name_key: string
          slug: string
          sort_order?: number | null
          thumbnail_url?: string | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          age_group_id?: string
          audio_url?: string | null
          component_key?: string
          created_at?: string | null
          curriculum_domain?: string | null
          description_key?: string | null
          difficulty?: number | null
          game_type?: string
          id?: string
          is_published?: boolean | null
          name_key?: string
          slug?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      handbook_media_assets: {
        Row: {
          byte_length: number | null
          checksum_sha256: string | null
          created_at: string
          duration_ms: number | null
          handbook_id: string
          height_px: number | null
          id: string
          kind: string
          mime_type: string | null
          sort_order: number
          storage_path: string
          width_px: number | null
        }
        Insert: {
          byte_length?: number | null
          checksum_sha256?: string | null
          created_at?: string
          duration_ms?: number | null
          handbook_id: string
          height_px?: number | null
          id?: string
          kind: string
          mime_type?: string | null
          sort_order?: number
          storage_path: string
          width_px?: number | null
        }
        Update: {
          byte_length?: number | null
          checksum_sha256?: string | null
          created_at?: string
          duration_ms?: number | null
          handbook_id?: string
          height_px?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          sort_order?: number
          storage_path?: string
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "handbook_media_assets_handbook_id_fkey"
            columns: ["handbook_id"]
            isOneToOne: false
            referencedRelation: "handbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      handbook_pages: {
        Row: {
          blocks_json: Json
          content_revision: number
          created_at: string
          estimated_read_sec: number | null
          handbook_id: string
          id: string
          interactions_json: Json
          layout_kind: string
          narration_key: string | null
          page_number: number
          updated_at: string
        }
        Insert: {
          blocks_json?: Json
          content_revision?: number
          created_at?: string
          estimated_read_sec?: number | null
          handbook_id: string
          id?: string
          interactions_json?: Json
          layout_kind?: string
          narration_key?: string | null
          page_number: number
          updated_at?: string
        }
        Update: {
          blocks_json?: Json
          content_revision?: number
          created_at?: string
          estimated_read_sec?: number | null
          handbook_id?: string
          id?: string
          interactions_json?: Json
          layout_kind?: string
          narration_key?: string | null
          page_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handbook_pages_handbook_id_fkey"
            columns: ["handbook_id"]
            isOneToOne: false
            referencedRelation: "handbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      handbooks: {
        Row: {
          age_group_id: string
          content_schema_version: number
          cover_thumbnail_url: string | null
          created_at: string
          description_key: string | null
          id: string
          is_published: boolean
          preload_manifest_json: Json
          slug: string
          sort_order: number
          theme_slug: string
          title_key: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          age_group_id: string
          content_schema_version?: number
          cover_thumbnail_url?: string | null
          created_at?: string
          description_key?: string | null
          id?: string
          is_published?: boolean
          preload_manifest_json?: Json
          slug: string
          sort_order?: number
          theme_slug?: string
          title_key: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          age_group_id?: string
          content_schema_version?: number
          cover_thumbnail_url?: string | null
          created_at?: string
          description_key?: string | null
          id?: string
          is_published?: boolean
          preload_manifest_json?: Json
          slug?: string
          sort_order?: number
          theme_slug?: string
          title_key?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handbooks_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbooks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          attempts: number | null
          child_id: string
          completed: boolean | null
          created_at: string | null
          game_id: string
          id: string
          last_played: string | null
          level_id: string | null
          score: number | null
          stars: number | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          child_id: string
          completed?: boolean | null
          created_at?: string | null
          game_id: string
          id?: string
          last_played?: string | null
          level_id?: string | null
          score?: number | null
          stars?: number | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          child_id?: string
          completed?: boolean | null
          created_at?: string | null
          game_id?: string
          id?: string
          last_played?: string | null
          level_id?: string | null
          score?: number | null
          stars?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_dimensions: {
        Row: {
          allows_multiple: boolean
          created_at: string
          id: string
          name_key: string
          slug: string
          sort_order: number
        }
        Insert: {
          allows_multiple?: boolean
          created_at?: string
          id?: string
          name_key: string
          slug: string
          sort_order?: number
        }
        Update: {
          allows_multiple?: boolean
          created_at?: string
          id?: string
          name_key?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          description_key: string | null
          dimension_id: string
          id: string
          is_active: boolean
          metadata_json: Json
          name_key: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_key?: string | null
          dimension_id: string
          id?: string
          is_active?: boolean
          metadata_json?: Json
          name_key: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_key?: string | null
          dimension_id?: string
          id?: string
          is_active?: boolean
          metadata_json?: Json
          name_key?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tags_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "tag_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          icon: string
          id: string
          name_key: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          icon: string
          id?: string
          name_key: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          icon?: string
          id?: string
          name_key?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          child_id: string
          id: string
          last_watched: string | null
          video_id: string
          watch_time_sec: number | null
          watched: boolean | null
        }
        Insert: {
          child_id: string
          id?: string
          last_watched?: string | null
          video_id: string
          watch_time_sec?: number | null
          watched?: boolean | null
        }
        Update: {
          child_id?: string
          id?: string
          last_watched?: string | null
          video_id?: string
          watch_time_sec?: number | null
          watched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tag_assignments: {
        Row: {
          assignment_role: string
          created_at: string
          id: string
          tag_id: string
          video_id: string
        }
        Insert: {
          assignment_role: string
          created_at?: string
          id?: string
          tag_id: string
          video_id: string
        }
        Update: {
          assignment_role?: string
          created_at?: string
          id?: string
          tag_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_tag_assignments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          age_group_id: string
          created_at: string | null
          description_key: string | null
          duration_sec: number | null
          id: string
          is_published: boolean | null
          name_key: string
          sort_order: number | null
          thumbnail_url: string | null
          topic_id: string
          updated_at: string | null
          video_type: string
          video_url: string
        }
        Insert: {
          age_group_id: string
          created_at?: string | null
          description_key?: string | null
          duration_sec?: number | null
          id?: string
          is_published?: boolean | null
          name_key: string
          sort_order?: number | null
          thumbnail_url?: string | null
          topic_id: string
          updated_at?: string | null
          video_type: string
          video_url: string
        }
        Update: {
          age_group_id?: string
          created_at?: string | null
          description_key?: string | null
          duration_sec?: number | null
          id?: string
          is_published?: boolean | null
          name_key?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          topic_id?: string
          updated_at?: string | null
          video_type?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dubiland_child_game_mastery_latest: {
        Row: {
          age_band: string | null
          attempt_created_at: string | null
          attempt_updated_at: string | null
          child_id: string | null
          difficulty_profile_id: string | null
          game_id: string | null
          in_support_mode: boolean | null
          last_activity_at: string | null
          latest_attempt_id: string | null
          latest_score: number | null
          latest_stars: number | null
          mastery_outcome: string | null
          served_level_id: string | null
          starting_level_id: string | null
          support_flags: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "game_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_difficulty_profile_id_fkey"
            columns: ["difficulty_profile_id"]
            isOneToOne: false
            referencedRelation: "game_difficulty_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_level_id_fkey"
            columns: ["served_level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_starting_level_id_fkey"
            columns: ["starting_level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      dubiland_parent_metrics_latest_v1: {
        Row: {
          accuracy_pct: number | null
          age_band: string | null
          attempt_id: string | null
          child_id: string | null
          decode_accuracy_pct: number | null
          domain: string | null
          gate_passed: boolean | null
          hint_trend: string | null
          independence_trend: string | null
          listen_participation_pct: number | null
          metric_as_of: string | null
          progression_band: string | null
          sequence_evidence_score: number | null
          skill_key: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      game_tags_expanded: {
        Row: {
          assignment_role: string | null
          content_id: string | null
          content_type: string | null
          dimension_slug: string | null
          tag_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_tag_assignments_game_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tags_expanded: {
        Row: {
          assignment_role: string | null
          content_id: string | null
          content_type: string | null
          dimension_slug: string | null
          tag_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_tag_assignments_video_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      dubiland_catalog_for_child: {
        Args: {
          p_age_band?: string
          p_child_id: string
          p_content_types?: string[]
          p_limit?: number
          p_offset?: number
          p_topic_slug?: string
        }
        Returns: {
          age_match_kind: string
          age_match_rank: number
          content_id: string
          content_type: string
          description_key: string
          difficulty_level: number
          name_key: string
          primary_age_band: string
          slug: string
          sort_order: number
          support_age_bands: string[]
          thumbnail_url: string
          topic_slug: string
        }[]
      }
      dubiland_child_age_band: { Args: { p_child_id: string }; Returns: string }
      dubiland_child_home_progress_metrics: {
        Args: { p_child_id: string; p_timezone?: string }
        Returns: {
          child_id: string
          game_progress_by_slug: Json
          today_learning_minutes: number
          topic_progress: Json
        }[]
      }
      dubiland_consecutive_play_streak_days: {
        Args: { p_child_id: string; p_tz: string }
        Returns: number
      }
      dubiland_parent_dashboard_curriculum_metrics: {
        Args: { p_timezone?: string }
        Returns: {
          avg_accuracy_pct_14d: number | null
          child_id: string
          domain: string
          hint_trend_latest: string | null
          independence_trend_latest: string | null
          last_skill_key: string | null
          progression_band_latest: string | null
          updated_at: string
        }[]
      }
      dubiland_parent_dashboard_metrics: {
        Args: { p_timezone?: string }
        Returns: {
          best_stars_across_games: number
          child_id: string
          consecutive_play_streak_days: number
          lifetime_learning_minutes: number
          lifetime_session_count: number
          rolling_7d_active_days: number
          rolling_7d_learning_minutes: number
          rolling_7d_session_count: number
          today_learning_minutes: number
        }[]
      }
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
