import type { Metadata } from 'next'
import MagicMetalHome from '@/components/MagicMetalHome'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

// The homepage is generated from the same catalog data as product pages.
// A missing root route must never leave a stale landing page on production.
export default function HomePage() {
  return <MagicMetalHome />
}
