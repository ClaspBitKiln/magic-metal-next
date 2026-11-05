import { getCatalogKindRequestHref, type CatalogProductKind } from '@/data/catalogProductKinds'
import './CatalogKindLinks.css'

export default function CatalogKindFallback({ kinds, requestHref }: { kinds: CatalogProductKind[]; requestHref: string }) {
  return <noscript>
    <p>Без JavaScript выберите вид для заявки; размеры можно написать в форме или приложить файлом.</p>
    <nav className="catalog-kind-fallback" aria-label="Заявка по виду изделия">
      {kinds.map(kind => <a key={kind.id} href={getCatalogKindRequestHref(requestHref, kind.value)}>{kind.label}</a>)}
    </nav>
  </noscript>
}
