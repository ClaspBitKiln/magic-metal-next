'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsPageView() {
  const pathname = usePathname()
  useEffect(() => { document.dispatchEvent(new CustomEvent('magicmet:page')) }, [pathname])
  return null
}
