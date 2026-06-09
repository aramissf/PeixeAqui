// Open-Meteo API response types

export type OpenMeteoCurrentWeather = {
  time: string
  temperature_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
  surface_pressure: number
  relative_humidity_2m: number
  visibility: number
  is_day: number
}

export type OpenMeteoHourly = {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  weather_code: number[]
  wind_speed_10m: number[]
  wind_direction_10m: number[]
  surface_pressure: number[]
}

export type OpenMeteoDaily = {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  sunrise: string[]
  sunset: string[]
  precipitation_sum: number[]
  wind_speed_10m_max: number[]
}

export type OpenMeteoMarine = {
  time: string[]
  wave_height: number[]
  wave_direction: number[]
  wave_period: number[]
  swell_wave_height: number[]
  swell_wave_direction: number[]
  swell_wave_period: number[]
  wind_wave_height: number[]
}

export type WeatherResponse = {
  lat: number
  lng: number
  fetchedAt: string
  current: OpenMeteoCurrentWeather
  hourly: OpenMeteoHourly
  daily: OpenMeteoDaily
  marine?: OpenMeteoMarine
  pressureTrend: 'rising' | 'falling' | 'stable'
  pressureChange3h: number // hPa
}

export type WeatherCode = {
  description: string
  icon: string
}

export const WMO_CODES: Record<number, WeatherCode> = {
  0: { description: 'Céu limpo', icon: 'sun' },
  1: { description: 'Principalmente limpo', icon: 'sun' },
  2: { description: 'Parcialmente nublado', icon: 'cloud-sun' },
  3: { description: 'Encoberto', icon: 'cloud' },
  45: { description: 'Neblina', icon: 'fog' },
  48: { description: 'Neblina com gelo', icon: 'fog' },
  51: { description: 'Garoa fraca', icon: 'drizzle' },
  53: { description: 'Garoa moderada', icon: 'drizzle' },
  55: { description: 'Garoa forte', icon: 'drizzle' },
  61: { description: 'Chuva fraca', icon: 'rain' },
  63: { description: 'Chuva moderada', icon: 'rain' },
  65: { description: 'Chuva forte', icon: 'rain' },
  80: { description: 'Chuva rápida fraca', icon: 'rain-shower' },
  81: { description: 'Chuva rápida moderada', icon: 'rain-shower' },
  82: { description: 'Chuva rápida intensa', icon: 'rain-shower' },
  95: { description: 'Trovoada', icon: 'thunder' },
  96: { description: 'Trovoada com granizo', icon: 'thunder' },
  99: { description: 'Trovoada forte com granizo', icon: 'thunder' },
}

export function getWindDirection(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  return dirs[Math.round(degrees / 22.5) % 16] ?? 'N'
}
