export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
      weather_daily_snapshots: {
        Row: {
          city: string;
          created_at: string;
          latitude: number;
          location_slug: string;
          longitude: number;
          observed_date: string;
          precipitation: number | null;
          source_name: string;
          source_updated_at: string | null;
          state: string;
          temperature_max: number;
          temperature_min: number;
          updated_at: string;
          wind_gust: number | null;
        };
        Insert: {
          city: string;
          created_at?: string;
          latitude: number;
          location_slug: string;
          longitude: number;
          observed_date: string;
          precipitation?: number | null;
          source_name: string;
          source_updated_at?: string | null;
          state: string;
          temperature_max: number;
          temperature_min: number;
          updated_at?: string;
          wind_gust?: number | null;
        };
        Update: {
          city?: string;
          created_at?: string;
          latitude?: number;
          location_slug?: string;
          longitude?: number;
          observed_date?: string;
          precipitation?: number | null;
          source_name?: string;
          source_updated_at?: string | null;
          state?: string;
          temperature_max?: number;
          temperature_min?: number;
          updated_at?: string;
          wind_gust?: number | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      update_account_preferences: {
        Args: {
          p_avatar_url: string | null;
          p_community_updates: boolean;
          p_daily_summary: boolean;
          p_display_name: string;
          p_email: string | null;
          p_water_alerts: boolean;
          p_weather_alerts: boolean;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
export type WeatherDailySnapshot = Database["public"]["Tables"]["weather_daily_snapshots"]["Row"];
