import type { Database, SpotMapMarker, SpotType, Environment, SpotWithDistance } from '@peixeaqui/types'
import { supabase } from './client'

type SpotRow = Database['public']['Tables']['fishing_spots']['Row']

// ─── Map viewport query ────────────────────────────────────────────────────────
// Uses PostGIS && bounding box operator with GIST index

export async function getSpotsInViewport(params: {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
  spotTypes?: SpotType[]
  environments?: Environment[]
  species?: string[]
  limit?: number
}): Promise<SpotMapMarker[]> {
  const { data, error } = await supabase.rpc('spots_in_viewport', {
    min_lng: params.minLng,
    min_lat: params.minLat,
    max_lng: params.maxLng,
    max_lat: params.maxLat,
    spot_types: params.spotTypes ?? null,
    environments: params.environments ?? null,
    species: params.species ?? null,
    limit_n: params.limit ?? 500,
  })

  if (error) throw error
  return data as SpotMapMarker[]
}

// ─── Nearby spots ──────────────────────────────────────────────────────────────
// Uses ST_DWithin with GIST index

export async function getNearbySpots(params: {
  lng: number
  lat: number
  radiusMeters?: number
  limit?: number
}): Promise<SpotWithDistance[]> {
  const { data, error } = await supabase.rpc('spots_nearby', {
    lng: params.lng,
    lat: params.lat,
    radius_m: params.radiusMeters ?? 50000,
    limit_n: params.limit ?? 20,
  })

  if (error) throw error
  return data as SpotWithDistance[]
}

// ─── Spot detail ───────────────────────────────────────────────────────────────

export async function getSpotById(id: string): Promise<SpotRow | null> {
  const { data, error } = await supabase
    .from('fishing_spots')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

// ─── Spot photos ───────────────────────────────────────────────────────────────

export async function getSpotPhotos(spotId: string, limit = 20) {
  const { data, error } = await supabase
    .from('spot_photos')
    .select('*')
    .eq('spot_id', spotId)
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

export async function getSpotReviews(spotId: string, limit = 10) {
  const { data, error } = await supabase
    .from('spot_reviews')
    .select(`
      *,
      profiles:user_id (
        username,
        display_name,
        avatar_url,
        level
      )
    `)
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ─── Search spots ──────────────────────────────────────────────────────────────
// Uses pg_trgm GIN index for fuzzy text search

export async function searchSpots(query: string, limit = 15) {
  const { data, error } = await supabase
    .from('fishing_spots')
    .select('id, name, spot_type, municipality, state, avg_rating')
    .eq('status', 'active')
    .ilike('name', `%${query}%`)
    .order('avg_rating', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ─── Insert spot ───────────────────────────────────────────────────────────────

export async function insertSpot(spot: Database['public']['Tables']['fishing_spots']['Insert']) {
  const { data, error } = await supabase
    .from('fishing_spots')
    .insert(spot)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Collections ───────────────────────────────────────────────────────────────

export async function getUserCollections(userId: string) {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })

  if (error) throw error
  return data
}

export async function addToCollection(collectionId: string, spotId: string) {
  const { error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, spot_id: spotId })

  if (error) throw error
}

export async function removeFromCollection(collectionId: string, spotId: string) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('spot_id', spotId)

  if (error) throw error
}
