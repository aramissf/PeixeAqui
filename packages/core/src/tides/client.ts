import type { TideExtreme } from '@peixeaqui/types'
import { supabase } from '../supabase/client'
import { format, addDays } from 'date-fns'

export type TideData = {
  extremes: TideExtreme[]
  nextExtreme: TideExtreme | null
  currentHeight: number | null
  tideState: 'rising' | 'falling' | 'high_slack' | 'low_slack'
}

// Calls the Edge Function which handles WorldTides API + caching
export async function getTides(lat: number, lng: number, daysAhead = 7): Promise<TideData> {
  const dateFrom = format(new Date(), 'yyyy-MM-dd')
  const dateTo = format(addDays(new Date(), daysAhead), 'yyyy-MM-dd')

  const { data, error } = await supabase.functions.invoke<{ extremes: TideExtreme[] }>('tide-refresh', {
    body: {
      lat: Math.round(lat * 1000) / 1000,
      lng: Math.round(lng * 1000) / 1000,
      dateFrom,
      dateTo,
    },
  })

  if (error) throw error
  if (!data) throw new Error('Empty tide response')

  const now = Date.now() / 1000
  const future = data.extremes.filter((e) => e.dt > now)
  const nextExtreme = future[0] ?? null

  // Determine current tide state from surrounding extremes
  const past = data.extremes.filter((e) => e.dt <= now)
  const lastExtreme = past[past.length - 1]
  let tideState: TideData['tideState'] = 'rising'

  if (lastExtreme && nextExtreme) {
    const minutesToNext = (nextExtreme.dt - now) / 60
    const slackWindow = 30 // minutes near extreme = "slack"

    if (minutesToNext < slackWindow) {
      tideState = nextExtreme.type === 'High' ? 'high_slack' : 'low_slack'
    } else {
      tideState = nextExtreme.type === 'High' ? 'rising' : 'falling'
    }
  }

  return {
    extremes: data.extremes,
    nextExtreme,
    currentHeight: null, // height data only with paid WorldTides plan
    tideState,
  }
}

export function formatTideTime(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTideHeight(meters: number): string {
  return `${meters.toFixed(2)}m`
}
