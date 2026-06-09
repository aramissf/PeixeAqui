import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@peixeaqui/core', '@peixeaqui/types', '@peixeaqui/ui'],
  images: {
    domains: [], // Add Supabase storage domain when configured
  },
  experimental: {
    optimizePackageImports: ['maplibre-gl'],
  },
}

export default nextConfig
