// Landing page with full-screen map
// Server component for SEO; map interaction is client-side

import { Suspense } from 'react'
import { MapView } from '../components/MapView'

export default function HomePage() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Suspense fallback={<MapSkeleton />}>
        <MapView />
      </Suspense>
    </main>
  )
}

function MapSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0A0E1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15 }}>
        Carregando mapa...
      </div>
    </div>
  )
}
