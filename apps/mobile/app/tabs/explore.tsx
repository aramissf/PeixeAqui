// Spot discovery and search
import { useState } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { colors, typography, spacing, borderRadius, getScoreColor, SPOT_TYPE_LABELS, ENVIRONMENT_LABELS } from '@peixeaqui/ui'
import { searchSpots, getNearbySpots } from '@peixeaqui/core/supabase'
import { useLocationStore } from '../../store/location'
import type { SpotType } from '@peixeaqui/types'

const SPOT_TYPE_FILTERS: { type: SpotType | 'all'; label: string }[] = [
  { type: 'all', label: 'Todos' },
  { type: 'beach', label: 'Praia' },
  { type: 'river', label: 'Rio' },
  { type: 'mangrove', label: 'Mangue' },
  { type: 'rocky_shore', label: 'Costão' },
  { type: 'lake', label: 'Lago' },
  { type: 'offshore', label: 'Offshore' },
]

export default function ExploreScreen() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<SpotType | 'all'>('all')
  const { userLocation } = useLocationStore()

  const { data: searchResults } = useQuery({
    queryKey: ['search', search],
    queryFn: () => searchSpots(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const { data: nearbySpots } = useQuery({
    queryKey: ['nearby', userLocation?.lat, userLocation?.lng],
    queryFn: () => getNearbySpots({
      lng: userLocation!.lng,
      lat: userLocation!.lat,
      radiusMeters: 50000,
    }),
    enabled: !!userLocation && search.length < 2,
    staleTime: 1000 * 60 * 10,
  })

  const displaySpots = search.length >= 2 ? (searchResults ?? []) : (nearbySpots ?? [])
  const filteredSpots = activeFilter === 'all'
    ? displaySpots
    : displaySpots.filter((s) => s.spot_type === activeFilter)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome, espécie, local..."
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Type filters — horizontal scroll */}
      <FlatList
        data={SPOT_TYPE_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, activeFilter === item.type && styles.filterChipActive]}
            onPress={() => setActiveFilter(item.type)}
          >
            <Text style={[
              styles.filterChipText,
              activeFilter === item.type && styles.filterChipTextActive,
            ]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Section label */}
      <Text style={styles.sectionLabel}>
        {search.length >= 2
          ? `${filteredSpots.length} resultado${filteredSpots.length !== 1 ? 's' : ''}`
          : 'PRÓXIMOS DE VOCÊ'
        }
      </Text>

      {/* Spot list */}
      <FlatList
        data={filteredSpots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.spotRow}
            onPress={() => router.push(`/spot/${item.id}`)}
          >
            <View style={styles.spotInfo}>
              <View style={styles.spotNameRow}>
                <Text style={styles.spotName} numberOfLines={1}>{item.name}</Text>
                {item.is_verified && (
                  <Text style={styles.verifiedBadge}>✓</Text>
                )}
              </View>
              <Text style={styles.spotMeta}>
                {SPOT_TYPE_LABELS[item.spot_type] ?? item.spot_type}
                {item.municipality ? ` · ${item.municipality}, ${item.state}` : ''}
                {'dist_m' in item ? ` · ${formatDistance((item as { dist_m: number }).dist_m)}` : ''}
              </Text>
              {item.target_species && item.target_species.length > 0 && (
                <Text style={styles.spotSpecies} numberOfLines={1}>
                  {item.target_species.slice(0, 3).join(', ')}
                </Text>
              )}
            </View>
            <View style={styles.spotRating}>
              <Text style={styles.ratingNumber}>{item.avg_rating.toFixed(1)}</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search.length >= 2
                ? 'Nenhum ponto encontrado. Tente outro nome.'
                : 'Ative a localização para ver pontos próximos.'
              }
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.base,
    backgroundColor: colors.dark.bgSurface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
    paddingVertical: spacing.md,
  },
  clearText: {
    color: colors.text.muted,
    fontSize: 16,
    padding: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.bgSurface,
  },
  filterChipActive: {
    borderColor: colors.brand.teal,
    backgroundColor: `${colors.brand.teal}22`,
  },
  filterChipText: {
    color: colors.text.secondary,
    fontSize: typography.size.caption,
    fontFamily: typography.family.sans,
  },
  filterChipTextActive: {
    color: colors.brand.teal,
    fontFamily: typography.family.sansBold,
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sansBold,
    letterSpacing: 1.5,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  separator: {
    height: 1,
    backgroundColor: colors.dark.border,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  spotInfo: {
    flex: 1,
    gap: 3,
  },
  spotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spotName: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sansBold,
  },
  verifiedBadge: {
    color: colors.brand.teal,
    fontSize: typography.size.caption,
  },
  spotMeta: {
    color: colors.text.secondary,
    fontSize: typography.size.caption,
    fontFamily: typography.family.sans,
  },
  spotSpecies: {
    color: colors.text.muted,
    fontSize: typography.size.caption,
    fontFamily: typography.family.sans,
    fontStyle: 'italic',
  },
  spotRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontFamily: typography.family.monoBold,
  },
  ratingStar: {
    color: colors.brand.amber,
    fontSize: 14,
  },
  emptyState: {
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
    textAlign: 'center',
  },
})
