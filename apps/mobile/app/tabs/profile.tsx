// User profile screen
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { colors, typography, spacing, borderRadius } from '@peixeaqui/ui'
import { supabase } from '@peixeaqui/core/supabase'
import { useAuthStore } from '../../store/auth'

export default function ProfileScreen() {
  const { user, profile } = useAuthStore()

  if (!user || !profile) {
    return <GuestProfile />
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.display_name?.[0]?.toUpperCase() ?? profile.username[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{profile.display_name ?? profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.is_pro_member && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO ANGLER</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem label="Pontos" value={profile.total_spots_added} />
          <View style={styles.statDivider} />
          <StatItem label="Fotos" value={profile.total_photos_added} />
          <View style={styles.statDivider} />
          <StatItem label="Reputação" value={profile.reputation_points} />
        </View>

        {/* Menu items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MINHA CONTA</Text>
          <MenuItem label="Meus pontos" onPress={() => {}} />
          <MenuItem label="Coleções" onPress={() => {}} />
          <MenuItem label="Diário de pesca" onPress={() => {}} badge="Em breve" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONFIGURAÇÕES</Text>
          <MenuItem label="Notificações" onPress={() => {}} />
          <MenuItem label="Downloads offline" onPress={() => {}} />
          {!profile.is_pro_member && (
            <MenuItem
              label="Assinar Pro Angler"
              onPress={() => {}}
              accent
              sublabel="R$14,90/mês · sem anúncios + offline"
            />
          )}
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={async () => {
            await supabase.auth.signOut()
          }}
        >
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function GuestProfile() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.guestContainer}>
        <Text style={styles.guestTitle}>Entre para salvar seus pontos</Text>
        <Text style={styles.guestSubtitle}>
          Crie uma conta gratuita para adicionar pontos, avaliar e montar suas coleções.
        </Text>
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginButtonText}>Entrar</Text>
        </Pressable>
        <Pressable
          style={styles.registerButton}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.registerButtonText}>Criar conta gratuita</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MenuItem({
  label,
  sublabel,
  onPress,
  badge,
  accent,
}: {
  label: string
  sublabel?: string
  onPress: () => void
  badge?: string
  accent?: boolean
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuItemLabel, accent && { color: colors.brand.amber }]}>{label}</Text>
        {sublabel && <Text style={styles.menuItemSublabel}>{sublabel}</Text>}
      </View>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : (
        <Text style={styles.menuArrow}>›</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.base,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.brand.teal}33`,
    borderWidth: 2,
    borderColor: colors.brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.brand.teal,
    fontSize: 32,
    fontFamily: typography.family.sansBold,
  },
  displayName: {
    color: colors.text.primary,
    fontSize: typography.size.title,
    fontFamily: typography.family.sansBold,
    marginBottom: 4,
  },
  username: {
    color: colors.text.secondary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
  },
  proBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.brand.amber}22`,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.brand.amber,
  },
  proBadgeText: {
    color: colors.brand.amber,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sansBold,
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.dark.bgSurface,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingVertical: spacing.base,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.size.title,
    fontFamily: typography.family.monoBold,
  },
  statLabel: {
    color: colors.text.muted,
    fontSize: typography.size.caption,
    fontFamily: typography.family.sans,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.dark.border,
  },
  section: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sansBold,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  menuItemLabel: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
  },
  menuItemSublabel: {
    color: colors.text.muted,
    fontSize: typography.size.caption,
    fontFamily: typography.family.sans,
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: colors.dark.bgElevated,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  menuBadgeText: {
    color: colors.text.muted,
    fontSize: typography.size.tiny,
    fontFamily: typography.family.sans,
  },
  menuArrow: {
    color: colors.text.muted,
    fontSize: 20,
    lineHeight: 20,
  },
  signOutButton: {
    margin: spacing.base,
    marginTop: 0,
    padding: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.text.muted,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.base,
  },
  guestTitle: {
    color: colors.text.primary,
    fontSize: typography.size.title,
    fontFamily: typography.family.sansBold,
    textAlign: 'center',
  },
  guestSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: colors.brand.teal,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: typography.size.body,
    fontFamily: typography.family.sansBold,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
  },
  registerButtonText: {
    color: colors.text.secondary,
    fontSize: typography.size.body,
    fontFamily: typography.family.sans,
  },
})
