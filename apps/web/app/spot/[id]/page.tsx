// Spot detail page — SSR for SEO
// Each spot gets a crawlable, shareable URL: /spot/[id]

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSpotById } from '@peixeaqui/core/supabase'
import { SPOT_TYPE_LABELS, ENVIRONMENT_LABELS } from '@peixeaqui/ui'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const spot = await getSpotById(id)

  if (!spot) {
    return { title: 'Ponto não encontrado — PeixeAqui' }
  }

  const typeLabel = SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type
  const location = [spot.municipality, spot.state].filter(Boolean).join(', ')

  return {
    title: `${spot.name} — ${typeLabel} em ${location} | PeixeAqui`,
    description: spot.description ?? `Ponto de pesca ${typeLabel.toLowerCase()} em ${location}. ${spot.target_species.slice(0, 3).join(', ')}.`,
    openGraph: {
      title: spot.name,
      description: spot.description ?? `${typeLabel} · ${location}`,
    },
  }
}

export default async function SpotPage({ params }: Props) {
  const { id } = await params
  const spot = await getSpotById(id)

  if (!spot) notFound()

  const typeLabel = SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type
  const envLabel = ENVIRONMENT_LABELS[spot.environment] ?? spot.environment
  const location = [spot.municipality, spot.state].filter(Boolean).join(', ')

  return (
    <div style={pageStyles.container}>
      {/* Back button */}
      <a href="/" style={pageStyles.back}>← Voltar ao mapa</a>

      {/* Hero */}
      <div style={pageStyles.hero}>
        <h1 style={pageStyles.title}>{spot.name}</h1>
        <div style={pageStyles.meta}>
          <span style={pageStyles.chip}>{typeLabel}</span>
          <span style={pageStyles.chip}>{envLabel}</span>
          {location && <span style={pageStyles.metaText}>{location}</span>}
          {spot.avg_rating > 0 && (
            <span style={pageStyles.rating}>★ {spot.avg_rating.toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* Description */}
      {spot.description && (
        <p style={pageStyles.description}>{spot.description}</p>
      )}

      {/* Species */}
      {spot.target_species.length > 0 && (
        <section style={pageStyles.section}>
          <h2 style={pageStyles.sectionTitle}>ESPÉCIES</h2>
          <div style={pageStyles.tagList}>
            {spot.target_species.map((species) => (
              <span key={species} style={pageStyles.tag}>{species}</span>
            ))}
          </div>
        </section>
      )}

      {/* Access notes */}
      {spot.access_notes && (
        <section style={pageStyles.section}>
          <h2 style={pageStyles.sectionTitle}>COMO CHEGAR</h2>
          <p style={pageStyles.bodyText}>{spot.access_notes}</p>
        </section>
      )}

      {/* Open in app CTA */}
      <div style={pageStyles.cta}>
        <p style={pageStyles.ctaText}>Ver condições ao vivo, marés e score do peixe no app</p>
        <a href={`peixeaqui://spot/${spot.id}`} style={pageStyles.ctaButton}>
          Abrir no app
        </a>
      </div>
    </div>
  )
}

// Inline styles — keeps this page self-contained for SSR
const pageStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0A0E1A',
    color: '#F1F5F9',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 16px 64px',
  },
  back: {
    color: '#94A3B8',
    fontSize: 14,
    display: 'block',
    marginBottom: 24,
  },
  hero: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 12,
    lineHeight: 1.2,
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#1C2537',
    border: '1px solid #263147',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 13,
    color: '#94A3B8',
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  rating: {
    color: '#F0920A',
    fontSize: 15,
    fontWeight: 600,
  },
  description: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 1.7,
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.5px',
    marginBottom: 12,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tag: {
    backgroundColor: '#111827',
    border: '1px solid #263147',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 14,
    color: '#F1F5F9',
    textTransform: 'capitalize' as const,
  },
  bodyText: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 1.6,
  },
  cta: {
    marginTop: 48,
    backgroundColor: '#111827',
    border: '1px solid #263147',
    borderRadius: 16,
    padding: 24,
    textAlign: 'center' as const,
  },
  ctaText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 16,
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#0AABB5',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    padding: '12px 32px',
    borderRadius: 12,
    textDecoration: 'none',
  },
} as const
