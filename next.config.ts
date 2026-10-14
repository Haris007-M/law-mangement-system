import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // no-referrer: setup links carry a token in the URL, never leak it to other sites
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Document uploads are sent through server actions (limit is enforced again in code at 8 MB)
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // never let browsers/proxies cache signed-in pages
      {
        source: '/(admin|lawyer|client|auth)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ]
  },
}

export default nextConfig
