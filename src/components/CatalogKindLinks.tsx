import { getCatalogKindHref, getCatalogProductKinds } from '@/data/catalogProductKinds'

export default function CatalogKindLinks({ href, title, home = false }: { href: string; title: string; home?: boolean }) {
  // Keep the landing page compact; full shape choices live in the color catalog.
  if (home && href.startsWith('/produkciya/cvetnye-metally/')) return null
  const kinds = getCatalogProductKinds(href)
  if (!kinds.length) return null
  return <nav className={home ? 'catalog-kind-links home-size-series' : 'catalog-kind-links'} aria-label={`Виды: ${title}`}>
    {kinds.map(kind => <a href={getCatalogKindHref(href, kind.id)} key={kind.id}>{kind.label}</a>)}
  </nav>
}
