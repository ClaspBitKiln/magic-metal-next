import { homeCatalogGroups } from '@/data/homeCatalog'

// Restore the existing category → nomenclature → specifications tree.
// Native disclosure elements work without client JavaScript.
export default function CatalogTree() {
  return <div className="restored-catalog" aria-label="Каталог продукции">
    {homeCatalogGroups.map((group) => <details className="catalog-group" key={group.title}>
      <summary><span className="catalog-toggle" aria-hidden="true" /><span><strong>{group.title}</strong><small>{group.note}</small></span></summary>
      <div className="catalog-table" aria-label={group.title}>
        <div className="catalog-row catalog-labels" aria-hidden="true"><span>Номенклатура</span><span>Размеры</span><span>Стандарты</span><span>Марки / исполнение</span></div>
        {group.items.map((item) => <details className="catalog-item" key={item.title}>
          <summary className="catalog-row"><strong><span className="catalog-toggle" aria-hidden="true" />{item.title}</strong><span>{item.size}</span><span>{item.standards}</span><span>{item.grades}</span></summary>
          <div className="home-size-series">
            <a href={item.href}>{item.href.startsWith('/produkciya/') ? 'Размеры, описание и ГОСТы' : 'Заявка на комплектацию'} →</a>
            <a href={`/?product=${encodeURIComponent(`Заявка на производство — ${item.availabilityQuery}`)}#request`}>Заявка на производство →</a>
          </div>
        </details>)}
      </div>
    </details>)}
  </div>
}
