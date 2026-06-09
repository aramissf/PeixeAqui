'use client'

import { useRef, useCallback, useState } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import { useQuery } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getSpotsInViewport } from '@peixeaqui/core/supabase'
import { getScoreColor, colors } from '@peixeaqui/ui'
import type { SpotMapMarker } from '@peixeaqui/types'
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre'

// Free dark map style from MapLibre demo (replace with custom style in production)
const MAP_STYLE = 'https://demotiles.maplibre.org/style.json'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 },
  },
})

export function MapView() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapViewInner />
    </QueryClientProvider>
  )
}

type Bounds = {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

function MapViewInner() {
  const mapRef = useRef<MapRef>(null)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)

  const { data: spots = [] } = useQuery<SpotMapMarker[]>({
    queryKey: ['spots-viewport-web', bounds],
    queryFn: () =>
      bounds
        ? getSpotsInViewport({
            minLng: bounds.minLng,
            minLat: bounds.minLat,
            maxLng: bounds.maxLng,
            maxLat: bounds.maxLat,
          })
        : [],
    enabled: !!bounds,
  })

  const onMove = useCallback((evt: ViewStateChangeEvent) => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    setBounds({
      minLng: b.getWest(),
      minLat: b.getSouth(),
      maxLng: b.getEast(),
      maxLat: b.getNorth(),
    })
  }, [])

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: -43.1729,
        latitude: -22.9068,
        zoom: 10,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      onMoveEnd={onMove}
      onLoad={onMove}
      attributionControl={true}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <GeolocateControl position="top-right" trackUserLocation={false} />

      {/* Condition pill overlay — top left */}
      <div style={overlayStyles.conditionsPill}>
        <span style={overlayStyles.pillText}>↗ 18km/h</span>
        <div style={overlayStyles.pillDivider} />
        <span style={overlayStyles.pillText}>≈ 1.2m</span>
      </div>

      {/* Spot markers */}
      {spots.map((spot) => {
        const color = getScoreColor(spot.fishing_score ?? 60)
        const isSelected = selectedSpot === spot.id

        return (
          <Marker
            key={spot.id}
            longitude={spot.lng}
            latitude={spot.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedSpot(isSelected ? null : spot.id)
            }}
          >
            <div
              style={{
                ...markerStyles.dot,
                borderColor: color,
                backgroundColor: `${color}33`,
                transform: isSelected ? 'scale(1.5)' : 'scale(1)',
                transition: 'transform 0.15s ease',
                cursor: 'pointer',
              }}
              title={spot.name}
            >
              <div style={{ ...markerStyles.core, backgroundColor: color }} />
            </div>
          </Marker>
        )
      })}

      {/* Selected spot tooltip */}
      {selectedSpot && (() => {
        const spot = spots.find((s) => s.id === selectedSpot)
        if (!spot) return null
        const color = getScoreColor(spot.fishing_score ?? 60)
        return (
          <Marker longitude={spot.lng} latitude={spot.lat + 0.01} anchor="bottom">
            <a href={`/spot/${spot.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ ...tooltipStyles.container }}>
                <span style={tooltipStyles.name}>{spot.name}</span>
                <span style={{ ...tooltipStyles.rating, color }}>
                  ★ {spot.avg_rating.toFixed(1)}
                </span>
              </div>
            </a>
          </Marker>
        )
      })()}

      {/* Search bar overlay */}
      <div style={overlayStyles.searchBar}>
        <span style={overlayStyles.searchIcon}>🔍</span>
        <span style={overlayStyles.searchText}>Buscar ponto de pesca...</span>
      </div>
    </Map>
  )
}

const overlayStyles: Record<string, React.CSSProperties> = {
  conditionsPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(28, 37, 55, 0.88)',
    border: `1px solid ${colors.dark.border}`,
    borderRadius: 999,
    padding: '6px 14px',
    backdropFilter: 'blur(8px)',
  },
  pillText: {
    color: colors.text.primary,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.dark.border,
  },
  searchBar: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(28, 37, 55, 0.92)',
    border: `1px solid ${colors.dark.border}`,
    borderRadius: 14,
    padding: '12px 20px',
    minWidth: 300,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  searchIcon: {
    fontSize: 16,
  },
  searchText: {
    color: colors.text.muted,
    fontSize: 15,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
}

const markerStyles: Record<string, React.CSSProperties> = {
  dot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 7,
    height: 7,
    borderRadius: '50%',
  },
}

const tooltipStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    border: `1px solid ${colors.dark.border}`,
    borderRadius: 10,
    padding: '8px 14px',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
  },
  name: {
    color: colors.text.primary,
    fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
  },
  rating: {
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
  },
}
