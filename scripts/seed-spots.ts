/**
 * Seed script: imports fishing spots from JSON into Supabase.
 * Usage: npx ts-node scripts/seed-spots.ts
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Database } from '../packages/types/src/database'

const supabaseUrl = process.env['SUPABASE_URL']
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

type SeedSpot = {
  name: string
  description: string
  location: { lng: number; lat: number }
  municipality?: string
  state?: string
  spot_type: string
  environment: string
  target_species?: string[]
  fishing_types?: string[]
  best_seasons?: string[]
  best_tides?: string[]
  best_time_of_day?: string[]
  access_notes?: string
}

async function seed() {
  const raw = readFileSync(join(__dirname, '../supabase/seed/spots_brazil_initial.json'), 'utf-8')
  const spots: SeedSpot[] = JSON.parse(raw)

  console.log(`Seeding ${spots.length} fishing spots...`)

  let successCount = 0
  let errorCount = 0

  for (const spot of spots) {
    // PostGIS geography point as WKT
    const wkt = `SRID=4326;POINT(${spot.location.lng} ${spot.location.lat})`

    const { error } = await supabase.from('fishing_spots').insert({
      name: spot.name,
      description: spot.description,
      location: wkt as unknown,
      municipality: spot.municipality,
      state: spot.state,
      spot_type: spot.spot_type as Database['public']['Tables']['fishing_spots']['Insert']['spot_type'],
      environment: spot.environment as Database['public']['Tables']['fishing_spots']['Insert']['environment'],
      target_species: spot.target_species ?? [],
      fishing_types: spot.fishing_types ?? [],
      best_seasons: spot.best_seasons ?? [],
      best_tides: spot.best_tides ?? [],
      best_time_of_day: spot.best_time_of_day ?? [],
      access_notes: spot.access_notes,
      is_verified: true,
      status: 'active',
    })

    if (error) {
      console.error(`✗ ${spot.name}: ${error.message}`)
      errorCount++
    } else {
      console.log(`✓ ${spot.name}`)
      successCount++
    }
  }

  console.log(`\nDone: ${successCount} inserted, ${errorCount} errors`)
}

seed().catch(console.error)
