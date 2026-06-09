// Conditions dashboard — weather, tides, fishing score
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { colors, typography, spacing, borderRadius, getScoreColor } from '@peixeaqui/ui'
import { getWeather } from '@peixeaqui/core/weather'
import { getTides } from '@peixeaqui/core/tides'
import { computeFishingScore } from '@peixeaqui/core/fishing-score'
import { useLocationStore } from '../../store/location'
import type { WeatherResponse } from '@peixeaqui/types'
import type { TideData } from '@peixeaqui/core/tides'

const DEFAULT_LAT = -22.9068
const DEFAULT_LNG = -43.1729

export default function WeatherScreen() {
  const { userLocation } = useLocationStore()
  const lat = userLocation?.lat ?? DEFAULT_LAT
  const lng = userLocation?.lng ?? DEFAULT_LNG

  const { data: weather, isLoading: weatherLoading } = useQuery<WeatherResponse>({
    queryKey: ['weather', Math.round(lat * 10) / 10, Math.round(lng * 10) / 10],
    queryFn: () => getWeather(lat, lng),
    staleTime: 1000 * 60 * 30,
  })

  const { data: tides } = useQuery<TideData>({
    queryKey: ['tides', Math.round(lat * 100) / 100, Math.round(lng * 100) / 100],
    queryFn: () => getTides(lat, lng),
    staleTime: 1000 * 60 * 60,
  })

  const fishingScore = weather && tides
    ? computeFishingScore({ lat, lng, weather, tides })
    : null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>CONDIÇÕES</Text>
          <Text style={styles.location}>Rio de Janeiro, RJ</Text>
        </View>

        {/* Current conditions */}
        {weather && (
          <CurrentConditions weather={weather} />
        )}

        {/* Fishing score */}
        {fishingScore && (
          <FishingScoreCard score={fishingScore} />
        )}

        {/* Tides */}
        {tides && (
          <TidesCard tides={tides} />
        )}

        {/* 24h forecast */}
        {weather && (
          <HourlyForecast weather={weather} />
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

function CurrentConditions({ weather }: { weather: WeatherResponse }) {
  const { current } = weather
  const pressureArrow = weather.pressureTrend === 'rising' ? '↑' : weather.pressureTrend === 'falling' ? '↓' : '→'
  const pressureLabel = weather.pressureTrend === 'falling' ? 'Caindo' : weather.pressureTrend === 'rising' ? 'Subindo' : 'Estável'

  return (
    <View style={styles.card}>
      {/* Main temperature */}
      <Text style={styles.tempHero}>{Math.round(current.temperature_2m)}°C</Text>
      <Text style={styles.tempApparent}>Sensação {Math.round(current.apparent_temperature)}°C</Text>

      {/* Pressure box — key fishing indicator */}
      <View style={styles.pressureBox}>
        <View>
          <Text style={styles.dataLabel}>PRESSÃO</Text>
          <Text style={styles.dataValue}>{Math.round(current.surface_pressure)} hPa</Text>
        </View>
        <View style={styles.pressureTrend}>
          <Text style={[
            styles.trendArrow,
            { color: weather.pressureTrend === 'falling' ? colors.score.excellent : colors.text.secondary }
          ]}>
            {pressureArrow} {pressureLabel}
          </Text>
          {weather.pressureTrend === 'falling' && (
            <Text style={styles.trendHint}>Peixe ativo!</Text>
          )}
        </View>
      </View>

      {/* Inline data row */}
      <View style={styles.dataRow}>
        <DataItem label="VENTO" value={`↗ ${Math.round(current.wind_speed_10m)} km/h`} />
        {weather.marine && (
          <DataItem label="ONDAS" value={`≈ ${(weather.marine.wave_height[0] ?? 0).toFixed(1)}m`} />
        )}
        <DataItem label="UMIDADE" value={`${Math.round(current.relative_humidity_2m)}%`} />
      </View>
    </View>
  )
}

function FishingScoreCard({ score }: { score: ReturnType<typeof computeFishingScore> }) {
  const color = getScoreColor(score.total)
  const barWidth = `${score.total}%`

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>ATIVIDADE DOS PEIXES</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreNumber, { color }]}>{score.total}</Text>
        <Text style={[styles.scoreLabel, { color }]}>{score.label}</Text>
      </View>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: barWidth as `${number}%`, backgroundColor: color }]} />
      </View>
      {/* Score breakdown */}
      <View style={styles.scoreBreakdown}>
        <ScoreItem label="Solunar" value={score.solunar} />
        <ScoreItem label="Pressão" value={score.pressure} />
        <ScoreItem label="Maré" value={score.tide} />
        <ScoreItem label="Vento" value={score.wind} />
      </View>
    </View>
  )
}

function TidesCard({ tides }: { tides: TideData }) {
  if (!tides.nextExtreme) return null

  const nextTime = new Date(tides.nextExtreme.dt * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const tideStateLabel: Record<TideData['tideState'], string> = {
    rising: 'Maré enchendo',
    falling: 'Maré vazando',
    high_slack: 'Maré alta (parada)',
    low_slack: 'Maré baixa (parada)',
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>MARÉS</Text>
      <View style={styles.tideRow}>
        <View>
          <Text style={styles.tideState}>{tideStateLabel[tides.tideState]}</Text>
          <Text style={styles.tideNext}>
            Próxima: {tides.nextExtreme.type === 'High' ? 'Alta' : 'Baixa'} às {nextTime} ({tides.nextExtreme.height.toFixed(2)}m)
          </Text>
        </View>
      </View>
      {/* Upcoming extremes */}
      <View style={styles.extremesList}>
        {tides.extremes.slice(0, 4).map((extreme, i) => (
          <View key={i} style={styles.extremeItem}>
            <Text style={[
              styles.extremeType,
              { color: extreme.type === 'High' ? colors.brand.teal : colors.text.secondary }
            ]}>
              {extreme.type === 'High' ? '▲ Alta' : '▼ Baixa'}
            </Text>
            <Text style={styles.extremeTime}>
              {new Date(extreme.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.extremeHeight}>{extreme.height.toFixed(2)}m</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function HourlyForecast({ weather }: { weather: WeatherResponse }) {
  const hours = weather.hourly.time.slice(0, 24)
  const temps = weather.hourly.temperature_2m.slice(0, 24)
  const winds = weather.hourly.wind_speed_10m.slice(0, 24)

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>PRÓXIMAS 24 HORAS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.hourlyRow}>
          {hours.map((time, i) => (
            <View key={time} style={styles.hourlyItem}>
              <Text style={styles.hourlyTime}>
                {new Date(time).getHours().toString().padStart(2, '0')}h
              </Text>
              <Text style={styles.hourlyTemp}>{Math.round(temps[i] ?? 0)}°</Text>
              <Text style={styles.hourlyWind}>{Math.round(winds[i] ?? 0)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  )
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreItemLabel}>{label}</Text>
      <Text style={[styles.scoreItemValue, { color: getScoreColor(value) }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  scroll: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sansBold,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  location: {
    color: colors.text.primary,
    fontSize: typography.size.heading,
    fontFamily: typography.family.sans,
  },
  card: {
    backgroundColor: colors.dark.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  tempHero: {
    color: colors.text.primary,
    fontSize: 48,
    fontFamily: typography.family.sans,
    fontWeight: '300',
    lineHeight: 56,
  },
  tempApparent: {
    color: colors.text.secondary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
    marginBottom: spacing.base,
  },
  pressureBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  pressureTrend: {
    alignItems: 'flex-end',
  },
  trendArrow: {
    fontSize: typography.size.body,
    fontFamily: typography.family.mono,
  },
  trendHint: {
    color: colors.score.excellent,
    fontSize: typography.size.caption,
    marginTop: 2,
  },
  dataRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dataItem: {
    flex: 1,
  },
  dataLabel: {
    color: colors.text.muted,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sansBold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  dataValue: {
    color: colors.text.primary,
    fontSize: typography.size.data,
    fontFamily: typography.family.mono,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreNumber: {
    fontSize: 40,
    fontFamily: typography.family.monoBold,
    lineHeight: 44,
  },
  scoreLabel: {
    fontSize: typography.size.heading,
    fontFamily: typography.family.sansBold,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.dark.bgElevated,
    borderRadius: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: colors.dark.bgElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  scoreItemLabel: {
    color: colors.text.muted,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sans,
    marginBottom: 2,
  },
  scoreItemValue: {
    fontSize: typography.size.body,
    fontFamily: typography.family.monoBold,
  },
  tideRow: {
    marginBottom: spacing.md,
  },
  tideState: {
    color: colors.text.primary,
    fontSize: typography.size.heading,
    fontFamily: typography.family.sansBold,
    marginBottom: 4,
  },
  tideNext: {
    color: colors.text.secondary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
  },
  extremesList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  extremeItem: {
    flex: 1,
    backgroundColor: colors.dark.bgElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  extremeType: {
    fontSize: typography.size.caption,
    fontFamily: typography.family.sansBold,
    marginBottom: 2,
  },
  extremeTime: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontFamily: typography.family.mono,
  },
  extremeHeight: {
    color: colors.text.secondary,
    fontSize: typography.size.caption,
    fontFamily: typography.family.mono,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  hourlyItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
  },
  hourlyTime: {
    color: colors.text.muted,
    fontSize: typography.size.caption,
    fontFamily: typography.family.mono,
  },
  hourlyTemp: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sansBold,
  },
  hourlyWind: {
    color: colors.text.secondary,
    fontSize: typography.size.caption,
    fontFamily: typography.family.mono,
  },
})
