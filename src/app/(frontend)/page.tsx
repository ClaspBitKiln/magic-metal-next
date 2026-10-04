import type { Metadata } from 'next'
import MagicMetalHome from '@/components/MagicMetalHome'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

export default function HomePage() {
  return <MagicMetalHome />
}
