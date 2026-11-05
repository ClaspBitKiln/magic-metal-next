import { getCatalogKindHref, getCatalogProductKinds } from '@/data/catalogProductKinds'

export default function CatalogKindLinks({ href, title, home = false }: { href: string; title: string; home?: boolean }) {
  const kinds = getCatalogProductKinds(href)
  if (!kinds.length) return null
  return <nav className={home ? 'catalog-kind-links home-size-series' : 'catalog-kind-links'} aria-label={`Виды: ${title}`}>
    {kinds.map(kind => <a href={getCatalogKindHref(href, kind.id)} key={kind.id}>{kind.label}</a>)}
  </nav>
}
