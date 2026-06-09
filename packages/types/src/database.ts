/**
 * Auto-generated types from Supabase schema.
 * Run: supabase gen types typescript --local > packages/types/src/database.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          state: string | null
          preferred_modalities: string[]
          is_pro_member: boolean
          pro_expires_at: string | null
          reputation_points: number
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          state?: string | null
          preferred_modalities?: string[]
          is_pro_member?: boolean
          pro_expires_at?: string | null
          reputation_points?: number
          level?: number
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      fishing_spots: {
        Row: {
          id: string
          created_by: string | null
          name: string
          description: string | null
          location: unknown // PostGIS GEOGRAPHY type
          municipality: string | null
          state: string | null
          country: string
          access_notes: string | null
          spot_type: SpotType
          environment: Environment
          water_body_name: string | null
          fishing_types: string[]
          target_species: string[]
          best_seasons: string[]
          best_tides: string[]
          best_time_of_day: string[]
          depth_min_m: number | null
          depth_max_m: number | null
          bottom_type: string[] | null
          avg_rating: number
          total_ratings: number
          total_photos: number
          total_visits: number
          is_verified: boolean
          is_public: boolean
          status: SpotStatus
          reported_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          name: string
          description?: string | null
          location: unknown
          municipality?: string | null
          state?: string | null
          country?: string
          access_notes?: string | null
          spot_type: SpotType
          environment: Environment
          water_body_name?: string | null
          fishing_types?: string[]
          target_species?: string[]
          best_seasons?: string[]
          best_tides?: string[]
          best_time_of_day?: string[]
          depth_min_m?: number | null
          depth_max_m?: number | null
          bottom_type?: string[] | null
          is_public?: boolean
          status?: SpotStatus
        }
        Update: Partial<Database['public']['Tables']['fishing_spots']['Insert']>
      }
      spot_photos: {
        Row: {
          id: string
          spot_id: string
          uploaded_by: string | null
          storage_path: string
          thumb_path: string | null
          caption: string | null
          width_px: number | null
          height_px: number | null
          file_size_kb: number | null
          taken_at: string | null
          is_featured: boolean
          is_approved: boolean
          likes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          uploaded_by?: string | null
          storage_path: string
          thumb_path?: string | null
          caption?: string | null
          width_px?: number | null
          height_px?: number | null
          file_size_kb?: number | null
          taken_at?: string | null
          is_featured?: boolean
          is_approved?: boolean
        }
        Update: Partial<Database['public']['Tables']['spot_photos']['Insert']>
      }
      spot_reviews: {
        Row: {
          id: string
          spot_id: string
          user_id: string
          rating: number
          title: string | null
          body: string | null
          visit_date: string | null
          fishes_caught: string[] | null
          bait_used: string | null
          technique: string | null
          tide_condition: string | null
          weather_description: string | null
          helpful_count: number
          is_verified_visit: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          user_id: string
          rating: number
          title?: string | null
          body?: string | null
          visit_date?: string | null
          fishes_caught?: string[] | null
          bait_used?: string | null
          technique?: string | null
          tide_condition?: string | null
          weather_description?: string | null
        }
        Update: Partial<Database['public']['Tables']['spot_reviews']['Insert']>
      }
      spot_routes: {
        Row: {
          id: string
          spot_id: string
          created_by: string | null
          name: string
          description: string | null
          route_type: RouteType | null
          track: unknown // PostGIS LINESTRING
          distance_km: number | null
          duration_min: number | null
          difficulty: RouteDifficulty | null
          gpx_storage_path: string | null
          waypoints: Json
          warnings: string[] | null
          total_downloads: number
          created_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          created_by?: string | null
          name?: string
          description?: string | null
          route_type?: RouteType | null
          track: unknown
          distance_km?: number | null
          duration_min?: number | null
          difficulty?: RouteDifficulty | null
          gpx_storage_path?: string | null
          waypoints?: Json
          warnings?: string[] | null
        }
        Update: Partial<Database['public']['Tables']['spot_routes']['Insert']>
      }
      weather_cache: {
        Row: {
          lat_grid: number
          lng_grid: number
          data_type: WeatherDataType
          payload: Json
          fetched_at: string
          expires_at: string
        }
        Insert: {
          lat_grid: number
          lng_grid: number
          data_type: WeatherDataType
          payload: Json
          fetched_at?: string
          expires_at: string
        }
        Update: Partial<Database['public']['Tables']['weather_cache']['Insert']>
      }
      tide_cache: {
        Row: {
          lat_grid: number
          lng_grid: number
          date_from: string
          date_to: string
          extremes: Json
          heights: Json | null
          fetched_at: string
        }
        Insert: {
          lat_grid: number
          lng_grid: number
          date_from: string
          date_to: string
          extremes: Json
          heights?: Json | null
        }
        Update: Partial<Database['public']['Tables']['tide_cache']['Insert']>
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_default: boolean
          is_public: boolean
          cover_photo_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          description?: string | null
          is_default?: boolean
          is_public?: boolean
          cover_photo_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['collections']['Insert']>
      }
      collection_items: {
        Row: {
          collection_id: string
          spot_id: string
          added_at: string
          notes: string | null
        }
        Insert: {
          collection_id: string
          spot_id: string
          notes?: string | null
        }
        Update: { notes?: string | null }
      }
      catch_log: {
        Row: {
          id: string
          user_id: string
          spot_id: string | null
          species: string
          weight_kg: number | null
          length_cm: number | null
          caught_at: string
          released: boolean
          photo_id: string | null
          bait: string | null
          technique: string | null
          notes: string | null
          solunar_score: number | null
          moon_phase: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          spot_id?: string | null
          species: string
          weight_kg?: number | null
          length_cm?: number | null
          caught_at: string
          released?: boolean
          photo_id?: string | null
          bait?: string | null
          technique?: string | null
          notes?: string | null
          solunar_score?: number | null
          moon_phase?: string | null
        }
        Update: Partial<Database['public']['Tables']['catch_log']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      spots_in_viewport: {
        Args: {
          min_lng: number
          min_lat: number
          max_lng: number
          max_lat: number
          spot_types?: string[]
          environments?: string[]
          species?: string[]
          limit_n?: number
        }
        Returns: SpotMapMarker[]
      }
      spots_nearby: {
        Args: {
          lng: number
          lat: number
          radius_m?: number
          limit_n?: number
        }
        Returns: SpotWithDistance[]
      }
    }
    Enums: Record<string, never>
  }
}

// ─── Domain Types ──────────────────────────────────────────────────────────────

export type SpotType =
  | 'beach'
  | 'river'
  | 'lake'
  | 'reservoir'
  | 'mangrove'
  | 'rocky_shore'
  | 'estuary'
  | 'pier'
  | 'boat_ramp'
  | 'offshore'
  | 'waterfall'
  | 'dam'

export type Environment = 'saltwater' | 'freshwater' | 'brackish'

export type SpotStatus = 'active' | 'pending' | 'rejected' | 'deleted'

export type RouteType = 'driving' | 'walking' | 'boat' | '4x4'

export type RouteDifficulty = 'easy' | 'moderate' | 'hard' | '4x4_only'

export type WeatherDataType = 'current' | 'hourly_24h' | 'daily_7d' | 'marine'

export type FishingScore = {
  total: number // 0-100
  label: 'Ruim' | 'Regular' | 'Bom' | 'Excelente'
  solunar: number
  pressure: number
  tide: number
  wind: number
  moon: number
}

export type TideExtreme = {
  dt: number // unix timestamp
  height: number // meters
  type: 'High' | 'Low'
}

export type SpotMapMarker = {
  id: string
  name: string
  spot_type: SpotType
  avg_rating: number
  total_ratings: number
  lng: number
  lat: number
  fishing_score?: number
}

export type SpotWithDistance = Database['public']['Tables']['fishing_spots']['Row'] & {
  dist_m: number
  lng: number
  lat: number
}

export type BrazilianState =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI'
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO'
