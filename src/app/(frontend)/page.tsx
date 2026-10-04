import type { Metadata } from 'next'
import MagicMetalHome from '@/components/MagicMetalHome'
import './home-minimal.css'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

export default function HomePage() {
  return <MagicMetalHome />
}
