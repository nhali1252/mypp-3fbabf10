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
      about_content: {
        Row: {
          bio: string | null
          experience_summary: string | null
          id: string
          image_url: string | null
          intro: string | null
          page_key: string
          skills: Json | null
          stats: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          experience_summary?: string | null
          id?: string
          image_url?: string | null
          intro?: string | null
          page_key?: string
          skills?: Json | null
          stats?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          experience_summary?: string | null
          id?: string
          image_url?: string | null
          intro?: string | null
          page_key?: string
          skills?: Json | null
          stats?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          period: string | null
          sort_order: number
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          period?: string | null
          sort_order?: number
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          period?: string | null
          sort_order?: number
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          address: string | null
          email: string | null
          form_receiver_email: string | null
          id: string
          map_link: string | null
          page_key: string
          phone: string | null
          social_links: Json | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          form_receiver_email?: string | null
          id?: string
          map_link?: string | null
          page_key?: string
          phone?: string | null
          social_links?: Json | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          form_receiver_email?: string | null
          id?: string
          map_link?: string | null
          page_key?: string
          phone?: string | null
          social_links?: Json | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          active: boolean
          created_at: string
          degree: string
          description: string | null
          gpa: string | null
          id: string
          institution: string | null
          period: string | null
          sort_order: number
          university: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          degree: string
          description?: string | null
          gpa?: string | null
          id?: string
          institution?: string | null
          period?: string | null
          sort_order?: number
          university?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          degree?: string
          description?: string | null
          gpa?: string | null
          id?: string
          institution?: string | null
          period?: string | null
          sort_order?: number
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      env_imports: {
        Row: {
          created_at: string
          created_count: number
          db_check: Json
          expected_count: number
          finished_at: string
          id: string
          logs: Json
          missing: Json
          present_count: number
          source: string
          started_at: string
          success: boolean
          updated_count: number
          vars: Json
        }
        Insert: {
          created_at?: string
          created_count?: number
          db_check?: Json
          expected_count: number
          finished_at: string
          id?: string
          logs?: Json
          missing?: Json
          present_count: number
          source?: string
          started_at: string
          success: boolean
          updated_count?: number
          vars?: Json
        }
        Update: {
          created_at?: string
          created_count?: number
          db_check?: Json
          expected_count?: number
          finished_at?: string
          id?: string
          logs?: Json
          missing?: Json
          present_count?: number
          source?: string
          started_at?: string
          success?: boolean
          updated_count?: number
          vars?: Json
        }
        Relationships: []
      }
      f_hero: {
        Row: {
          eyebrow: string
          headline: string
          highlight: string
          id: string
          intro: string
          updated_at: string
        }
        Insert: {
          eyebrow?: string
          headline?: string
          highlight?: string
          id?: string
          intro?: string
          updated_at?: string
        }
        Update: {
          eyebrow?: string
          headline?: string
          highlight?: string
          id?: string
          intro?: string
          updated_at?: string
        }
        Relationships: []
      }
      f_photocard: {
        Row: {
          badge_bottom: string | null
          badge_top: string | null
          id: string
          image_url: string | null
          name: string
          open_label: string | null
          role: string
          updated_at: string
        }
        Insert: {
          badge_bottom?: string | null
          badge_top?: string | null
          id?: string
          image_url?: string | null
          name?: string
          open_label?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          badge_bottom?: string | null
          badge_top?: string | null
          id?: string
          image_url?: string | null
          name?: string
          open_label?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      f_projects: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          sort_order: number
          tags: Json
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          tags?: Json
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          tags?: Json
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      f_skills: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string
          id: string
          kind: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          kind?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          kind?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          body: string
          created_at: string
          edited_at: string | null
          id: string
          item_id: string
          parent_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          item_id: string
          parent_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          item_id?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          status: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      footer_apps: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      footer_cta: {
        Row: {
          active: boolean
          call_label: string
          email_label: string
          eyebrow: string
          headline: string
          id: string
          primary_label: string
          primary_url: string
          show_call: boolean
          show_email: boolean
          show_whatsapp: boolean
          singleton: boolean
          subtext: string
          updated_at: string
          whatsapp_label: string
        }
        Insert: {
          active?: boolean
          call_label?: string
          email_label?: string
          eyebrow?: string
          headline?: string
          id?: string
          primary_label?: string
          primary_url?: string
          show_call?: boolean
          show_email?: boolean
          show_whatsapp?: boolean
          singleton?: boolean
          subtext?: string
          updated_at?: string
          whatsapp_label?: string
        }
        Update: {
          active?: boolean
          call_label?: string
          email_label?: string
          eyebrow?: string
          headline?: string
          id?: string
          primary_label?: string
          primary_url?: string
          show_call?: boolean
          show_email?: boolean
          show_whatsapp?: boolean
          singleton?: boolean
          subtext?: string
          updated_at?: string
          whatsapp_label?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          active: boolean
          id: string
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
          sort_order?: number
          url: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          backdrop_name: string | null
          background_style: string | null
          eyebrow: string | null
          headline: string
          id: string
          page_key: string
          portrait_url: string | null
          primary_cta_label: string | null
          primary_cta_url: string | null
          secondary_cta_label: string | null
          secondary_cta_url: string | null
          subheadline: string | null
          updated_at: string
        }
        Insert: {
          backdrop_name?: string | null
          background_style?: string | null
          eyebrow?: string | null
          headline: string
          id?: string
          page_key?: string
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          secondary_cta_label?: string | null
          secondary_cta_url?: string | null
          subheadline?: string | null
          updated_at?: string
        }
        Update: {
          backdrop_name?: string | null
          background_style?: string | null
          eyebrow?: string | null
          headline?: string
          id?: string
          page_key?: string
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          secondary_cta_label?: string | null
          secondary_cta_url?: string | null
          subheadline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      launcher_hero: {
        Row: {
          eyebrow: string
          headline_bottom: string
          headline_top: string
          id: string
          intro: string
          updated_at: string
        }
        Insert: {
          eyebrow?: string
          headline_bottom?: string
          headline_top?: string
          id?: string
          intro?: string
          updated_at?: string
        }
        Update: {
          eyebrow?: string
          headline_bottom?: string
          headline_top?: string
          id?: string
          intro?: string
          updated_at?: string
        }
        Relationships: []
      }
      launcher_pages: {
        Row: {
          accent: string | null
          active: boolean
          badge: string | null
          created_at: string
          description: string | null
          id: string
          label: string
          route: string
          sort_order: number
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent?: string | null
          active?: boolean
          badge?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label: string
          route: string
          sort_order?: number
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accent?: string | null
          active?: boolean
          badge?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          route?: string
          sort_order?: number
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          is_replied: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          is_replied?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          is_replied?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      moderation_log: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          reason: string | null
          snapshot: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          reason?: string | null
          snapshot?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          snapshot?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      nav_links: {
        Row: {
          active: boolean
          id: string
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
          sort_order?: number
          url: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      page_loader_settings: {
        Row: {
          default_label: string
          default_tagline: string
          id: string
          initial_ms: number
          route_ms: number
          routes: Json
          singleton: boolean
          updated_at: string
        }
        Insert: {
          default_label?: string
          default_tagline?: string
          id?: string
          initial_ms?: number
          route_ms?: number
          routes?: Json
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          default_label?: string
          default_tagline?: string
          id?: string
          initial_ms?: number
          route_ms?: number
          routes?: Json
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      page_quotes: {
        Row: {
          active: boolean
          author: string | null
          eyebrow: string | null
          id: string
          page_slug: string
          quote: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author?: string | null
          eyebrow?: string | null
          id?: string
          page_slug: string
          quote?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author?: string | null
          eyebrow?: string | null
          id?: string
          page_slug?: string
          quote?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_folders: {
        Row: {
          active: boolean
          cover_url: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "portfolio_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          external_url: string | null
          featured: boolean
          feed_caption: string | null
          folder_id: string
          id: string
          image_url: string | null
          show_in_feed: boolean
          sort_order: number
          tags: Json
          title: string
          updated_at: string
          watermark_text: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          external_url?: string | null
          featured?: boolean
          feed_caption?: string | null
          folder_id: string
          id?: string
          image_url?: string | null
          show_in_feed?: boolean
          sort_order?: number
          tags?: Json
          title: string
          updated_at?: string
          watermark_text?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          external_url?: string | null
          featured?: boolean
          feed_caption?: string | null
          folder_id?: string
          id?: string
          image_url?: string | null
          show_in_feed?: boolean
          sort_order?: number
          tags?: Json
          title?: string
          updated_at?: string
          watermark_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "portfolio_folders"
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
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          featured: boolean
          features: Json
          gallery: Json | null
          github_url: string | null
          id: string
          image_url: string | null
          live_url: string | null
          published: boolean
          slug: string
          sort_order: number
          summary: string | null
          title: string
          tools: Json | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          features?: Json
          gallery?: Json | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          live_url?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          tools?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          features?: Json
          gallery?: Json | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          live_url?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          tools?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          id: string
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          page_key: string
          updated_at: string
        }
        Insert: {
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          page_key: string
          updated_at?: string
        }
        Update: {
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          page_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          default_motion_pref: string
          favicon_url: string | null
          footer_text: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_url: string | null
          page_key: string
          primary_color: string | null
          reactions_enabled: boolean
          secondary_color: string | null
          section_visibility: Json
          site_name: string | null
          site_title: string
          theme_primary: string | null
          updated_at: string
          watermark_text: string | null
          welcome_animation_ms: number
        }
        Insert: {
          default_motion_pref?: string
          favicon_url?: string | null
          footer_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          page_key?: string
          primary_color?: string | null
          reactions_enabled?: boolean
          secondary_color?: string | null
          section_visibility?: Json
          site_name?: string | null
          site_title?: string
          theme_primary?: string | null
          updated_at?: string
          watermark_text?: string | null
          welcome_animation_ms?: number
        }
        Update: {
          default_motion_pref?: string
          favicon_url?: string | null
          footer_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          page_key?: string
          primary_color?: string | null
          reactions_enabled?: boolean
          secondary_color?: string | null
          section_visibility?: Json
          site_name?: string | null
          site_title?: string
          theme_primary?: string | null
          updated_at?: string
          watermark_text?: string | null
          welcome_animation_ms?: number
        }
        Relationships: []
      }
      slots: {
        Row: {
          card_size: string
          contact_number: string | null
          created_at: string
          folder_id: string
          highlight_text: string | null
          id: string
          sort_order: number
          status: boolean
          subtitle: string | null
          title: string
          type: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          card_size?: string
          contact_number?: string | null
          created_at?: string
          folder_id: string
          highlight_text?: string | null
          id?: string
          sort_order?: number
          status?: boolean
          subtitle?: string | null
          title: string
          type?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          card_size?: string
          contact_number?: string | null
          created_at?: string
          folder_id?: string
          highlight_text?: string | null
          id?: string
          sort_order?: number
          status?: boolean
          subtitle?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      taxi_services: {
        Row: {
          badge: string | null
          button_link: string | null
          button_text: string | null
          contact_number: string | null
          created_at: string
          description: string | null
          duration: string | null
          features: Json | null
          id: string
          price: string | null
          service_name: string
          slot_id: string
          sort_order: number
          status: boolean
          updated_at: string
        }
        Insert: {
          badge?: string | null
          button_link?: string | null
          button_text?: string | null
          contact_number?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          price?: string | null
          service_name: string
          slot_id: string
          sort_order?: number
          status?: boolean
          updated_at?: string
        }
        Update: {
          badge?: string | null
          button_link?: string | null
          button_text?: string | null
          contact_number?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          features?: Json | null
          id?: string
          price?: string | null
          service_name?: string
          slot_id?: string
          sort_order?: number
          status?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxi_services_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          client_name: string
          company: string | null
          created_at: string
          featured: boolean
          id: string
          published: boolean
          rating: number | null
          review: string
          role: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_name: string
          company?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          published?: boolean
          rating?: number | null
          review: string
          role?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_name?: string
          company?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          published?: boolean
          rating?: number | null
          review?: string
          role?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticker_items: {
        Row: {
          active: boolean
          created_at: string
          id: string
          sort_order: number
          text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          text: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_public_tables: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
