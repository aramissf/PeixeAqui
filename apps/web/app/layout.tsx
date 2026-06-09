import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'PeixeAqui — Pontos de pesca no Brasil',
  description:
    'Descubra os melhores pontos de pesca do Brasil. Praias, rios, mangues, costões e mais — com previsão do tempo, marés e atividade dos peixes em tempo real.',
  keywords: ['pesca', 'pontos de pesca', 'pesca brasil', 'maré', 'condições de pesca', 'tucunaré', 'robalo'],
  openGraph: {
    title: 'PeixeAqui',
    description: 'Os melhores pontos de pesca do Brasil',
    siteName: 'PeixeAqui',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PeixeAqui',
    description: 'Os melhores pontos de pesca do Brasil',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
