'use client'

import { useState, useSyncExternalStore } from 'react'
import type { CatalogProductKind } from '@/data/catalogProductKinds'

const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify)
  return () => window.removeEventListener('popstate', notify)
}
const readKind = () => new URLSearchParams(window.location.search).get('kind') || ''
const serverKind = () => ''

// Read only the current picker's whitelist after hydration. Unknown or foreign
// kinds never become product values. Native links use document navigation.
export function useCatalogKind(kinds: CatalogProductKind[], fallback: string) {
  const urlKind = useSyncExternalStore(subscribe, readKind, serverKind)
  const [choice, setChoice] = useState<string | null>(null)
  const value = kinds.find(kind => kind.id === (choice ?? urlKind))?.value ?? fallback
  return [value, setChoice] as const
}
