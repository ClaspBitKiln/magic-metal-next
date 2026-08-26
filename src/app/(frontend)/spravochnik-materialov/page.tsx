import type { Metadata } from 'next'
import Link from 'next/link'

import MaterialsSearch from '@/components/MaterialsSearch'
import { materialGroups, materials } from '@/data/materials'
import './materials.css'

export const metadata: Metadata = {
  title: 'Справочник марок сталей и сплавов',
  description: 'Марки сталей и сплавов: ГОСТы, свойства, применение, справочные аналоги и связанный металлопрокат.',
  alternates: { canonical: '/spravochnik-materialov' },
}

export default function MaterialsDirectoryPage() {
  return (
    <main className="materials-page">
      <header className="materials-header"><Link href="/"><b>←</b> Мэджик Металл</Link><Link className="materials-cta" href="/#request">Отправить заявку ↗</Link></header>
      <section className="materials-hero">
        <p>Справочник · материалы и ГОСТ</p>
        <h1>Марки сталей<br /><em>и сплавов</em></h1>
        <span>Свойства, применение, стандарты и связанные товарные позиции. Подбор материала и аналога подтверждаем по техническому заданию.</span>
      </section>
      <MaterialsSearch />
      <nav className="materials-groups" aria-label="Группы материалов">
        {materialGroups.map((group) => <a key={group.key} href={`#${group.key}`}>{group.label}</a>)}
      </nav>
      <section className="materials-directory">
        {materialGroups.map((group, groupIndex) => {
          const groupMaterials = materials.filter((material) => material.group === group.key)
          if (!groupMaterials.length) return null
          return <section className="materials-group" id={group.key} key={group.key}>
            <div className="materials-group-title"><span>{String(groupIndex + 1).padStart(2, '0')}</span><h2>{group.label}</h2><p>{groupMaterials.length} {groupMaterials.length === 1 ? 'материал' : 'материалов'}</p></div>
            <div className="materials-grid">{groupMaterials.map((material) => <Link href={`/spravochnik-materialov/${material.slug}`} key={material.slug}>
              <span>{material.designation}</span><h3>{material.name}</h3><p>{material.summary}</p><b>Характеристики и применение →</b>
            </Link>)}</div>
          </section>
        })}
      </section>
      <section className="materials-note"><p>Важно</p><h2>Марка — только часть требования</h2><span>При подборе учитываем вид продукции, стандарт, состояние поставки, размеры, рабочую среду, температуру, давление, контроль и документы. Справочные аналоги не означают автоматическую взаимозаменяемость.</span><Link href="/#request">Подобрать материал по ТЗ ↗</Link></section>
    </main>
  )
}
