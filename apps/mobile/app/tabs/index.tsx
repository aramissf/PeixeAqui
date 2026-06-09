// Main map screen — the map IS the interface
import { useRef, useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { colors, typography, spacing, borderRadius, shadow, getScoreColor } from '@peixeaqui/ui'
import type { SpotMapMarker } from '@peixeaqui/types'
import { getSpotsInViewport } from '@peixeaqui/core/supabase'
import { useLocationStore } from '../../store/location'

// MapLibre GL for vector tiles (no API key, offline-capable with PMTiles)
import MapLibreGL from '@maplibre/maplibre-react-native'

MapLibreGL.setAccessToken(null) // OSM tiles don't need a token

const OSM_STYLE = 'https://demotiles.maplibre.org/style.json' // free demo; replace with custom dark style

type Viewport = {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

export default function MapScreen() {
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [fishingScore, setFishingScore] = useState<number>(0)
  const { userLocation } = useLocationStore()

  const { data: spots = [] } = useQuery<SpotMapMarker[]>({
    queryKey: ['spots-viewport', viewport],
    queryFn: () =>
      viewport
        ? getSpotsInViewport({
            minLng: viewport.minLng,
            minLat: viewport.minLat,
            maxLng: viewport.maxLng,
            maxLat: viewport.maxLat,
          })
        : [],
    enabled: !!viewport,
    staleTime: 1000 * 60 * 5, // 5 min
  })

  const onRegionDidChange = useCallback(async () => {
    if (!mapRef.current) return
    const bounds = await mapRef.current.getVisibleBounds()
    if (!bounds) return
    const [ne, sw] = bounds
    setViewport({
      minLng: sw[0] ?? 0,
      minLat: sw[1] ?? 0,
      maxLng: ne[0] ?? 0,
      maxLat: ne[1] ?? 0,
    })
  }, [])

  const scoreColor = getScoreColor(fishingScore)

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={OSM_STYLE}
        onRegionDidChange={onRegionDidChange}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={10}
          centerCoordinate={
            userLocation
              ? [userLocation.lng, userLocation.lat]
              : [-43.1729, -22.9068] // Rio de Janeiro default
          }
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* User location dot */}
        <MapLibreGL.UserLocation visible renderMode="native" />

        {/* Spot markers */}
        {spots.map((spot) => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            onPress={() => router.push(`/spot/${spot.id}`)}
          />
        ))}
      </MapLibreGL.MapView>

      {/* Floating conditions pill — top left */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <ConditionsPill />
      </SafeAreaView>

      {/* Fishing score badge — center */}
      <View style={styles.scoreBadge}>
        <View style={[styles.scoreBadgeInner, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{fishingScore}</Text>
          <Text style={styles.scoreIcon}>🐟</Text>
        </View>
      </View>

      {/* Search bar — bottom */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/tabs/explore')}
        >
          <SearchBarIcon />
          <Text style={styles.searchPlaceholder}>Buscar ponto de pesca...</Text>
        </Pressable>

        {/* FAB: add spot */}
        <Pressable
          style={styles.fab}
          onPress={() => {
            // TODO: add spot flow
          }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

// ─── Spot marker ──────────────────────────────────────────────────────────────

function SpotMarker({ spot, onPress }: { spot: SpotMapMarker; onPress: () => void }) {
  const color = getScoreColor(spot.fishing_score ?? 60)

  return (
    <MapLibreGL.MarkerView
      coordinate={[spot.lng, spot.lat]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Pressable onPress={onPress} hitSlop={12}>
        <View style={[markerStyles.dot, { borderColor: color, backgroundColor: `${color}33` }]}>
          <View style={[markerStyles.dotCore, { backgroundColor: color }]} />
        </View>
      </Pressable>
    </MapLibreGL.MarkerView>
  )
}

// ─── Conditions pill ──────────────────────────────────────────────────────────

function ConditionsPill() {
  // TODO: wire up to weather query from location store
  return (
    <View style={pillStyles.container}>
      <Text style={pillStyles.text}>↗ 18km/h</Text>
      <View style={pillStyles.divider} />
      <Text style={pillStyles.text}>≈ 1.2m</Text>
    </View>
  )
}

function SearchBarIcon() {
  const Svg = require('react-native-svg').default
  const Path = require('react-native-svg').Path
  const Circle = require('react-native-svg').Circle
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: spacing.sm }}>
      <Circle cx={11} cy={11} r={7} stroke={colors.text.secondary} strokeWidth={1.5} />
      <Path d="M16.5 16.5L21 21" stroke={colors.text.secondary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: spacing.base,
    right: spacing.base,
    zIndex: 10,
  },
  scoreBadge: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  scoreBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.dark.bgSurface}CC`,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    ...shadow.sm,
  },
  scoreNumber: {
    fontFamily: typography.family.monoBold,
    fontSize: 18,
    lineHeight: 22,
  },
  scoreIcon: {
    fontSize: 16,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.dark.bgElevated}F0`,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    ...shadow.md,
  },
  searchPlaceholder: {
    color: colors.text.secondary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: 80,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
  },
})

const markerStyles = StyleSheet.create({
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: `${colors.dark.bgElevated}E0`,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: spacing.sm,
    ...shadow.sm,
  },
  text: {
    color: colors.text.primary,
    fontSize: typography.size.caption,
    fontFamily: typography.family.mono,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.dark.border,
  },
})
