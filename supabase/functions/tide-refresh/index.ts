// Supabase Edge Function: tide-refresh
// Proxy between the app and WorldTides API, caching results per station per day.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WORLDTIDES_BASE = 'https://www.worldtides.info/api/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lat, lng, dateFrom, dateTo } = await req.json() as {
      lat: number
      lng: number
      dateFrom: string
      dateTo: string
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const latGrid = Math.round(lat * 1000) / 1000
    const lngGrid = Math.round(lng * 1000) / 1000

    // Check cache (tides only change once per day)
    const { data: cached } = await supabase
      .from('tide_cache')
      .select('extremes')
      .eq('lat_grid', latGrid)
      .eq('lng_grid', lngGrid)
      .eq('date_from', dateFrom)
      .single()

    if (cached?.extremes) {
      return new Response(
        JSON.stringify({ extremes: cached.extremes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const apiKey = Deno.env.get('WORLDTIDES_API_KEY')
    if (!apiKey) {
      // Return empty extremes if no API key configured (development mode)
      return new Response(
        JSON.stringify({ extremes: [], warning: 'WorldTides API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const params = new URLSearchParams({
      extremes: '',
      lat: lat.toString(),
      lon: lng.toString(),
      start: new Date(dateFrom).getTime().toString().slice(0, -3),
      length: '604800', // 7 days in seconds
      key: apiKey,
    })

    const response = await fetch(`${WORLDTIDES_BASE}?${params}`)
    if (!response.ok) throw new Error(`WorldTides error: ${response.status}`)

    const data = await response.json() as {
      extremes?: Array<{ dt: number; height: number; type: string }>
    }

    const extremes = data.extremes?.map((e) => ({
      dt: e.dt,
      height: e.height,
      type: e.type as 'High' | 'Low',
    })) ?? []

    // Cache result
    await supabase.from('tide_cache').upsert({
      lat_grid: latGrid,
      lng_grid: lngGrid,
      date_from: dateFrom,
      date_to: dateTo,
      extremes,
      fetched_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ extremes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
