export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_access: {
        Row: {
          created_at: string;
          source: string;
          status: string;
          tier: string;
          updated_at: string;
          user_id: string;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string;
          source?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id: string;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string;
          source?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      account_consent_events: {
        Row: {
          channel: string;
          created_at: string;
          granted: boolean;
          id: number;
          policy_version: string;
          source: string;
          user_id: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          granted: boolean;
          id?: never;
          policy_version: string;
          source?: string;
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          granted?: boolean;
          id?: never;
          policy_version?: string;
          source?: string;
          user_id?: string;
        };
        Relationships: [];
      };
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
      weather_collector_settings: {
        Row: {
          collector_token: string;
          created_at: string;
          enabled: boolean;
          endpoint: string;
          station_id: string;
          updated_at: string;
        };
        Insert: {
          collector_token?: string;
          created_at?: string;
          enabled?: boolean;
          endpoint: string;
          station_id: string;
          updated_at?: string;
        };
        Update: {
          collector_token?: string;
          created_at?: string;
          enabled?: boolean;
          endpoint?: string;
          station_id?: string;
          updated_at?: string;
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
      weather_station_current: {
        Row: {
          created_at: string;
          dew_point: number | null;
          error: string | null;
          feels_like: number | null;
          fetched_at: string | null;
          humidity: number | null;
          last_attempt_at: string | null;
          last_success_at: string | null;
          observation_time: string | null;
          payload: Json;
          pressure: number | null;
          pressure_trend: string | null;
          provider: string;
          rain_annual: number | null;
          rain_daily: number | null;
          rain_monthly: number | null;
          refresh_lease_token: string | null;
          refresh_started_at: string | null;
          source_hash: string | null;
          station_id: string;
          station_name: string;
          status: string;
          temperature: number | null;
          updated_at: string;
          wind_direction: string | null;
          wind_speed: number | null;
        };
        Insert: {
          created_at?: string;
          dew_point?: number | null;
          error?: string | null;
          feels_like?: number | null;
          fetched_at?: string | null;
          humidity?: number | null;
          last_attempt_at?: string | null;
          last_success_at?: string | null;
          observation_time?: string | null;
          payload?: Json;
          pressure?: number | null;
          pressure_trend?: string | null;
          provider: string;
          rain_annual?: number | null;
          rain_daily?: number | null;
          rain_monthly?: number | null;
          refresh_lease_token?: string | null;
          refresh_started_at?: string | null;
          source_hash?: string | null;
          station_id: string;
          station_name: string;
          status?: string;
          temperature?: number | null;
          updated_at?: string;
          wind_direction?: string | null;
          wind_speed?: number | null;
        };
        Update: {
          created_at?: string;
          dew_point?: number | null;
          error?: string | null;
          feels_like?: number | null;
          fetched_at?: string | null;
          humidity?: number | null;
          last_attempt_at?: string | null;
          last_success_at?: string | null;
          observation_time?: string | null;
          payload?: Json;
          pressure?: number | null;
          pressure_trend?: string | null;
          provider?: string;
          rain_annual?: number | null;
          rain_daily?: number | null;
          rain_monthly?: number | null;
          refresh_lease_token?: string | null;
          refresh_started_at?: string | null;
          source_hash?: string | null;
          station_id?: string;
          station_name?: string;
          status?: string;
          temperature?: number | null;
          updated_at?: string;
          wind_direction?: string | null;
          wind_speed?: number | null;
        };
        Relationships: [];
      };
      weather_station_observations: {
        Row: {
          created_at: string;
          dew_point: number | null;
          feels_like: number | null;
          fetched_at: string;
          humidity: number | null;
          id: number;
          observation_time: string | null;
          payload: Json;
          pressure: number | null;
          pressure_trend: string | null;
          provider: string;
          rain_annual: number | null;
          rain_daily: number | null;
          rain_monthly: number | null;
          source_hash: string;
          station_id: string;
          station_name: string;
          status: string;
          temperature: number | null;
          wind_direction: string | null;
          wind_speed: number | null;
        };
        Insert: {
          created_at?: string;
          dew_point?: number | null;
          feels_like?: number | null;
          fetched_at: string;
          humidity?: number | null;
          id?: never;
          observation_time?: string | null;
          payload: Json;
          pressure?: number | null;
          pressure_trend?: string | null;
          provider: string;
          rain_annual?: number | null;
          rain_daily?: number | null;
          rain_monthly?: number | null;
          source_hash: string;
          station_id: string;
          station_name: string;
          status: string;
          temperature?: number | null;
          wind_direction?: string | null;
          wind_speed?: number | null;
        };
        Update: {
          created_at?: string;
          dew_point?: number | null;
          feels_like?: number | null;
          fetched_at?: string;
          humidity?: number | null;
          id?: never;
          observation_time?: string | null;
          payload?: Json;
          pressure?: number | null;
          pressure_trend?: string | null;
          provider?: string;
          rain_annual?: number | null;
          rain_daily?: number | null;
          rain_monthly?: number | null;
          source_hash?: string;
          station_id?: string;
          station_name?: string;
          status?: string;
          temperature?: number | null;
          wind_direction?: string | null;
          wind_speed?: number | null;
        };
        Relationships: [];
      };
      web_push_dispatches: {
        Row: {
          claimed_at: string;
          completed_at: string | null;
          failed_count: number;
          fingerprint: string;
          lease_token: string;
          removed_count: number;
          sent_at: string;
          sent_count: number;
          status: string;
          title: string;
        };
        Insert: {
          claimed_at?: string;
          completed_at?: string | null;
          failed_count?: number;
          fingerprint: string;
          lease_token: string;
          removed_count?: number;
          sent_at?: string;
          sent_count?: number;
          status?: string;
          title: string;
        };
        Update: {
          claimed_at?: string;
          completed_at?: string | null;
          failed_count?: number;
          fingerprint?: string;
          lease_token?: string;
          removed_count?: number;
          sent_at?: string;
          sent_count?: number;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      web_push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          expiration_time: number | null;
          last_seen_at: string;
          p256dh: string;
          topics: string[];
          updated_at: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          expiration_time?: number | null;
          last_seen_at?: string;
          p256dh: string;
          topics?: string[];
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          expiration_time?: number | null;
          last_seen_at?: string;
          p256dh?: string;
          topics?: string[];
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_weather_station_refresh: {
        Args: {
          p_lease_token: string;
          p_stale_after_seconds?: number;
          p_station_id: string;
        };
        Returns: boolean;
      };
      claim_web_push_dispatch: {
        Args: {
          p_fingerprint: string;
          p_lease_token: string;
          p_stale_after_seconds?: number;
          p_title: string;
        };
        Returns: boolean;
      };
      ensure_current_user_account_foundation: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      invoke_embrapa_collector: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
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

export type AccountAccess = Database["public"]["Tables"]["account_access"]["Row"];
export type AccountConsentEvent = Database["public"]["Tables"]["account_consent_events"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
export type WeatherCollectorSettings = Database["public"]["Tables"]["weather_collector_settings"]["Row"];
export type WeatherDailySnapshot = Database["public"]["Tables"]["weather_daily_snapshots"]["Row"];
export type WeatherStationCurrent = Database["public"]["Tables"]["weather_station_current"]["Row"];
export type WeatherStationObservation = Database["public"]["Tables"]["weather_station_observations"]["Row"];
export type WebPushDispatch = Database["public"]["Tables"]["web_push_dispatches"]["Row"];
export type WebPushSubscription = Database["public"]["Tables"]["web_push_subscriptions"]["Row"];
