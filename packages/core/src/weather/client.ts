import type { WeatherResponse, OpenMeteoCurrentWeather, OpenMeteoHourly, OpenMeteoDaily, OpenMeteoMarine } from '@peixeaqui/types'
import { supabase } from '../supabase/client'

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1'
const OPEN_METEO_MARINE = 'https://marine-api.open-meteo.com/v1'

// Round coordinates to 0.1° grid to maximize cache hits
function roundToGrid(value: number, precision = 1): number {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

// ─── Server-side cached fetch (primary path) ───────────────────────────────────
// Calls the Supabase Edge Function which handles caching in weather_cache table

export async function getWeather(lat: number, lng: number): Promise<WeatherResponse> {
  const { data, error } = await supabase.functions.invoke<WeatherResponse>('weather-refresh', {
    body: { lat: roundToGrid(lat), lng: roundToGrid(lng) },
  })

  if (error) throw error
  if (!data) throw new Error('Empty weather response')
  return data
}

// ─── Direct Open-Meteo fetch (used only inside Edge Functions) ─────────────────

export async function fetchWeatherDirect(lat: number, lng: number): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'surface_pressure',
      'relative_humidity_2m',
      'visibility',
      'is_day',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'wind_speed_10m_max',
    ].join(','),
    forecast_days: '7',
    timezone: 'America/Sao_Paulo',
    wind_speed_unit: 'kmh',
  })

  const [weatherRes, marineRes] = await Promise.allSettled([
    fetch(`${OPEN_METEO_BASE}/forecast?${params}`),
    fetch(`${OPEN_METEO_MARINE}/marine?${new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      hourly: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height',
      forecast_days: '7',
      timezone: 'America/Sao_Paulo',
    })}`),
  ])

  if (weatherRes.status === 'rejected') throw new Error('Failed to fetch weather data')
  if (!weatherRes.value.ok) throw new Error(`Open-Meteo error: ${weatherRes.value.status}`)

  const weather = await weatherRes.value.json() as {
    current: OpenMeteoCurrentWeather
    hourly: OpenMeteoHourly
    daily: OpenMeteoDaily
  }

  let marine: OpenMeteoMarine | undefined
  if (marineRes.status === 'fulfilled' && marineRes.value.ok) {
    const marineData = await marineRes.value.json() as { hourly: OpenMeteoMarine }
    marine = marineData.hourly
  }

  // Calculate pressure trend from hourly data (last 3 hours vs now)
  const pressureNow = weather.current.surface_pressure
  const pressureHistory = weather.hourly.surface_pressure.slice(0, 3)
  const pressureAvg = pressureHistory.reduce((a, b) => a + b, 0) / pressureHistory.length
  const pressureChange3h = pressureNow - pressureAvg

  return {
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    current: weather.current,
    hourly: weather.hourly,
    daily: weather.daily,
    marine,
    pressureTrend: pressureChange3h > 0.5 ? 'rising' : pressureChange3h < -0.5 ? 'falling' : 'stable',
    pressureChange3h,
  }
}
