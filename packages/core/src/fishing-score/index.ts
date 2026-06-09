import type { FishingScore, WeatherResponse } from '@peixeaqui/types'
import type { TideData } from '../tides/client'
import { getCurrentSolunarScore } from '../solunar'

type FishingScoreInput = {
  lat: number
  lng: number
  weather: WeatherResponse
  tides: TideData
  now?: Date
}

export function computeFishingScore(input: FishingScoreInput): FishingScore {
  const { lat, lng, weather, tides, now = new Date() } = input

  // 1. Solunar score (35%)
  const solunarScore = getCurrentSolunarScore(lat, lng, now)

  // 2. Barometric pressure score (25%)
  // Falling pressure = fish actively feeding before storm
  // Rapidly rising pressure after storm = tough fishing
  const pressureScore = computePressureScore(weather.pressureChange3h, weather.pressureTrend)

  // 3. Tide phase score (20%)
  const tideScore = computeTideScore(tides)

  // 4. Wind score (12%)
  const windScore = computeWindScore(weather.current.wind_speed_10m)

  // 5. Moon illumination component (8%)
  const moonScore = computeMoonScore(weather.current)

  const total = Math.round(
    solunarScore * 0.35 +
    pressureScore * 0.25 +
    tideScore * 0.20 +
    windScore * 0.12 +
    moonScore * 0.08
  )

  return {
    total,
    label: total >= 76 ? 'Excelente' : total >= 51 ? 'Bom' : total >= 26 ? 'Regular' : 'Ruim',
    solunar: solunarScore,
    pressure: pressureScore,
    tide: tideScore,
    wind: windScore,
    moon: moonScore,
  }
}

function computePressureScore(change3h: number, trend: 'rising' | 'falling' | 'stable'): number {
  // Moderate falling pressure (0.5-3 hPa drop in 3h) = excellent fishing
  if (trend === 'falling') {
    if (change3h < -3) return 95  // rapid fall = feeding frenzy
    if (change3h < -1) return 85  // moderate fall = very active
    return 70                      // slight fall = active
  }
  if (trend === 'stable') return 60 // stable = normal
  // Rising pressure
  if (change3h > 3) return 25      // rapid rise post-storm = very slow
  return 45                         // slight rise = moderate
}

function computeTideScore(tides: TideData): number {
  if (!tides.nextExtreme) return 50

  const now = Date.now() / 1000
  const minutesToExtreme = (tides.nextExtreme.dt - now) / 60

  // Best 1-2 hours before and after tide extreme = incoming/outgoing flow
  if (minutesToExtreme < 0) return 40 // extreme just passed, slack beginning
  if (minutesToExtreme < 30) return 90  // approaching extreme = max current
  if (minutesToExtreme < 90) return 80  // 1.5h before = strong current
  if (minutesToExtreme < 150) return 65 // 2.5h before = building current

  // Slack water periods (within 30min of high/low): slower for many species
  if (tides.tideState === 'high_slack' || tides.tideState === 'low_slack') return 45

  return 55
}

function computeWindScore(windSpeedKmh: number): number {
  // Light winds (5-20 km/h) are usually ideal
  if (windSpeedKmh < 5) return 55   // too calm: surface flat, fish see line
  if (windSpeedKmh <= 20) return 90  // ideal: ripple, oxygenation, bait movement
  if (windSpeedKmh <= 35) return 65  // moderate: workable
  if (windSpeedKmh <= 50) return 35  // strong: difficult casting, rough sea
  return 15                           // too windy: unsafe/impractical
}

function computeMoonScore(current: WeatherResponse['current']): number {
  // Night fishing with moon: is_day = 0 and bright moon = fish can see
  // Night fishing without moon: better for some species (robalo/snook)
  // We use a simple proxy here; full solunar data comes from solunar module
  return current.is_day === 1 ? 60 : 70
}
