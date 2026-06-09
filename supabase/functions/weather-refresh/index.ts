// Supabase Edge Function: weather-refresh
// Proxy between the app and Open-Meteo, with server-side caching in weather_cache table.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1'
const OPEN_METEO_MARINE = 'https://marine-api.open-meteo.com/v1'

const TTL_MINUTES: Record<string, number> = {
  current: 60,
  hourly_24h: 180,
  daily_7d: 360,
  marine: 180,
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lat, lng } = await req.json() as { lat: number; lng: number }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service role client to bypass RLS for cache writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const now = new Date()

    // Check if we have fresh cached data for all types
    const { data: cached } = await supabase
      .from('weather_cache')
      .select('data_type, payload, expires_at')
      .eq('lat_grid', lat)
      .eq('lng_grid', lng)
      .gt('expires_at', now.toISOString())

    const cachedByType = new Map(cached?.map((r) => [r.data_type, r.payload]) ?? [])
    const hasAll = ['current', 'hourly_24h', 'daily_7d', 'marine'].every((t) => cachedByType.has(t))

    if (hasAll) {
      return new Response(
        JSON.stringify(buildResponse(lat, lng, cachedByType, now.toISOString())),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch fresh data from Open-Meteo
    const [weatherRes, marineRes] = await Promise.allSettled([
      fetch(`${OPEN_METEO_BASE}/forecast?${buildWeatherParams(lat, lng)}`),
      fetch(`${OPEN_METEO_MARINE}/marine?${buildMarineParams(lat, lng)}`),
    ])

    if (weatherRes.status === 'rejected' || !weatherRes.value.ok) {
      throw new Error('Open-Meteo weather fetch failed')
    }

    const weather = await weatherRes.value.json()
    let marine = null
    if (marineRes.status === 'fulfilled' && marineRes.value.ok) {
      marine = await marineRes.value.json()
    }

    // Upsert cache entries
    const upserts = [
      { data_type: 'current', payload: weather.current },
      { data_type: 'hourly_24h', payload: weather.hourly },
      { data_type: 'daily_7d', payload: weather.daily },
      { data_type: 'marine', payload: marine?.hourly ?? null },
    ]
      .filter(({ payload }) => payload !== null)
      .map(({ data_type, payload }) => ({
        lat_grid: lat,
        lng_grid: lng,
        data_type,
        payload,
        fetched_at: now.toISOString(),
        expires_at: new Date(
          now.getTime() + (TTL_MINUTES[data_type] ?? 60) * 60000,
        ).toISOString(),
      }))

    await supabase.from('weather_cache').upsert(upserts)

    const freshByType = new Map(upserts.map(({ data_type, payload }) => [data_type, payload]))
    const merged = new Map([...cachedByType, ...freshByType])

    // Compute pressure trend
    const hourlyPressure = (freshByType.get('hourly_24h') as { surface_pressure?: number[] } | null)?.surface_pressure ?? []
    const currentPressure = (freshByType.get('current') as { surface_pressure?: number } | null)?.surface_pressure ?? 0
    const pressureAvg = hourlyPressure.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    const pressureChange3h = currentPressure - pressureAvg

    return new Response(
      JSON.stringify({
        ...buildResponse(lat, lng, merged, now.toISOString()),
        pressureTrend: pressureChange3h > 0.5 ? 'rising' : pressureChange3h < -0.5 ? 'falling' : 'stable',
        pressureChange3h,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

function buildWeatherParams(lat: number, lng: number): string {
  return new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,relative_humidity_2m,visibility,is_day',
    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max',
    forecast_days: '7',
    timezone: 'America/Sao_Paulo',
    wind_speed_unit: 'kmh',
  }).toString()
}

function buildMarineParams(lat: number, lng: number): string {
  return new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height',
    forecast_days: '7',
    timezone: 'America/Sao_Paulo',
  }).toString()
}

function buildResponse(lat: number, lng: number, data: Map<string, unknown>, fetchedAt: string) {
  return {
    lat,
    lng,
    fetchedAt,
    current: data.get('current'),
    hourly: data.get('hourly_24h'),
    daily: data.get('daily_7d'),
    marine: data.get('marine'),
    pressureTrend: 'stable',
    pressureChange3h: 0,
  }
}
