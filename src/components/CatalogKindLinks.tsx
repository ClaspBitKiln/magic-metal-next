import { getCatalogKindHref, getCatalogProductKinds } from '@/data/catalogProductKinds'

export default function CatalogKindLinks({ href, title }: { href: string; title: string }) {
  const kinds = getCatalogProductKinds(href)
  if (!kinds.length) return null
  return <nav className="catalog-kind-links" aria-label={`Виды: ${title}`}>
    {kinds.map(kind => <a href={getCatalogKindHref(href, kind.id)} key={kind.id}>{kind.label}</a>)}
  </nav>
}
