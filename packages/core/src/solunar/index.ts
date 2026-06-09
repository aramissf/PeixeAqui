// Solunar theory: fish are most active when the moon is directly overhead
// or underfoot (major periods), and at moonrise/moonset (minor periods).
// Combined with moon phase illumination for a daily activity index.

export type SolunarPeriod = {
  start: Date
  end: Date
  type: 'major' | 'minor'
  qualityMinutes: number
}

export type SolunarDay = {
  date: Date
  periods: SolunarPeriod[]
  moonPhase: number // 0-1 (0 = new moon, 0.5 = full moon, 1 = new moon again)
  moonPhaseName: MoonPhaseName
  moonIllumination: number // 0-1
  dailyScore: number // 0-100
}

export type MoonPhaseName =
  | 'Nova'
  | 'Crescente Côncava'
  | 'Quarto Crescente'
  | 'Crescente Convexa'
  | 'Cheia'
  | 'Minguante Convexa'
  | 'Quarto Minguante'
  | 'Minguante Côncava'

const J2000 = 2451545.0 // Julian date of J2000.0 epoch
const LUNAR_CYCLE = 29.53058867 // synodic month in days

function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

function getMoonPhase(date: Date): { phase: number; illumination: number } {
  const jd = toJulianDate(date)
  const daysSinceJ2000 = jd - J2000
  const phase = ((daysSinceJ2000 % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE / LUNAR_CYCLE
  // Illumination: 0 at new moon, 1 at full moon
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2
  return { phase, illumination }
}

function getMoonPhaseName(phase: number): MoonPhaseName {
  if (phase < 0.025 || phase >= 0.975) return 'Nova'
  if (phase < 0.225) return 'Crescente Côncava'
  if (phase < 0.275) return 'Quarto Crescente'
  if (phase < 0.475) return 'Crescente Convexa'
  if (phase < 0.525) return 'Cheia'
  if (phase < 0.725) return 'Minguante Convexa'
  if (phase < 0.775) return 'Quarto Minguante'
  return 'Minguante Côncava'
}

// Simplified lunar transit calculation
// Returns the time of moon transit (overhead) at the given coordinates
function getMoonTransit(date: Date, lat: number, lng: number): Date {
  const jd = toJulianDate(date)
  const T = (jd - J2000) / 36525

  // Moon's mean longitude
  const L0 = (218.316 + 13.176396 * (jd - J2000)) % 360
  // Correction for elliptical orbit
  const M = ((134.963 + 13.064993 * (jd - J2000)) % 360) * (Math.PI / 180)
  const correction = 6.289 * Math.sin(M)
  const moonLongitude = (L0 + correction) % 360

  // Convert moon longitude to transit time (hours)
  const lmst = (100.4606184 + 36000.77004 * T + lng) % 360
  let hourAngle = (moonLongitude - lmst) % 360
  if (hourAngle < 0) hourAngle += 360
  if (hourAngle > 180) hourAngle -= 360

  const transitHours = 12 - hourAngle / 15
  const transitDate = new Date(date)
  transitDate.setHours(0, 0, 0, 0)
  transitDate.setTime(transitDate.getTime() + transitHours * 3600000)
  return transitDate
}

export function getSolunarDay(date: Date, lat: number, lng: number): SolunarDay {
  const { phase, illumination } = getMoonPhase(date)
  const moonPhaseName = getMoonPhaseName(phase)

  const transitOverhead = getMoonTransit(date, lat, lng)
  const transitUnderfoot = new Date(transitOverhead.getTime() + 12.4 * 3600000)

  const MAJOR_DURATION_MS = 2 * 3600000  // 2 hours
  const MINOR_DURATION_MS = 1 * 3600000  // 1 hour

  const periods: SolunarPeriod[] = [
    // Major: moon overhead
    {
      start: new Date(transitOverhead.getTime() - MAJOR_DURATION_MS / 2),
      end: new Date(transitOverhead.getTime() + MAJOR_DURATION_MS / 2),
      type: 'major',
      qualityMinutes: 120,
    },
    // Major: moon underfoot
    {
      start: new Date(transitUnderfoot.getTime() - MAJOR_DURATION_MS / 2),
      end: new Date(transitUnderfoot.getTime() + MAJOR_DURATION_MS / 2),
      type: 'major',
      qualityMinutes: 120,
    },
    // Minor: moonrise (approx transit - 6.2h)
    {
      start: new Date(transitOverhead.getTime() - 6.2 * 3600000 - MINOR_DURATION_MS / 2),
      end: new Date(transitOverhead.getTime() - 6.2 * 3600000 + MINOR_DURATION_MS / 2),
      type: 'minor',
      qualityMinutes: 60,
    },
    // Minor: moonset (approx transit + 6.2h)
    {
      start: new Date(transitOverhead.getTime() + 6.2 * 3600000 - MINOR_DURATION_MS / 2),
      end: new Date(transitOverhead.getTime() + 6.2 * 3600000 + MINOR_DURATION_MS / 2),
      type: 'minor',
      qualityMinutes: 60,
    },
  ]

  // Daily score: base from moon phase (new/full = best), boosted by period overlap with daytime
  const phaseScore = illumination > 0.85 || illumination < 0.15
    ? 90 // full or new moon = excellent
    : illumination > 0.7 || illumination < 0.3
      ? 75
      : 60

  return {
    date,
    periods,
    moonPhase: phase,
    moonPhaseName,
    moonIllumination: illumination,
    dailyScore: phaseScore,
  }
}

// Returns the solunar score for RIGHT NOW (0-100)
export function getCurrentSolunarScore(lat: number, lng: number, now = new Date()): number {
  const solunar = getSolunarDay(now, lat, lng)
  const nowMs = now.getTime()

  // Check if we're inside a major or minor period
  for (const period of solunar.periods) {
    if (nowMs >= period.start.getTime() && nowMs <= period.end.getTime()) {
      // Inside a period: score based on how close to peak and moon quality
      const periodMid = (period.start.getTime() + period.end.getTime()) / 2
      const distFromPeak = Math.abs(nowMs - periodMid)
      const halfDuration = (period.end.getTime() - period.start.getTime()) / 2
      const proximityFactor = 1 - distFromPeak / halfDuration // 1 at peak, 0 at edge

      const basePeriodScore = period.type === 'major' ? 85 : 65
      return Math.round(basePeriodScore * proximityFactor + (100 - basePeriodScore) * solunar.moonIllumination)
    }
  }

  // Not in a period: find minutes to next period
  const nextPeriod = solunar.periods
    .filter((p) => p.start.getTime() > nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

  if (!nextPeriod) return Math.round(30 * solunar.moonIllumination)

  const minutesToNext = (nextPeriod.start.getTime() - nowMs) / 60000

  // Score rises as we approach the next period
  if (minutesToNext < 30) {
    return Math.round(50 + (30 - minutesToNext) * 1.5)
  }

  return Math.round(20 + 10 * solunar.moonIllumination)
}
