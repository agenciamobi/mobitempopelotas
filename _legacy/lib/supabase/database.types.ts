export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          community_updates: boolean;
          created_at: string;
          daily_summary: boolean;
          updated_at: string;
          user_id: string;
          water_alerts: boolean;
          weather_alerts: boolean;
        };
        Insert: {
          community_updates?: boolean;
          created_at?: string;
          daily_summary?: boolean;
          updated_at?: string;
          user_id: string;
          water_alerts?: boolean;
          weather_alerts?: boolean;
        };
        Update: {
          community_updates?: boolean;
          created_at?: string;
          daily_summary?: boolean;
          updated_at?: string;
          user_id?: string;
          water_alerts?: boolean;
          weather_alerts?: boolean;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserPreferences =
  Database["public"]["Tables"]["user_preferences"]["Row"];
