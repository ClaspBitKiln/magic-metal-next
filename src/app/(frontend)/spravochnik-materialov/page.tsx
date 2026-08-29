import type { Metadata } from 'next'
import Link from 'next/link'

import DirectoryGroupNav from '@/components/DirectoryGroupNav'
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
      <header className="materials-header"><Link href="/"><b>←</b> На главную</Link><Link className="materials-cta" href="/#request">Отправить заявку ↗</Link></header>
      <section className="materials-hero">
        <p>Справочник · материалы и ГОСТ</p>
        <h1>Марки сталей<br /><em>и сплавов</em></h1>
        <span>Свойства, применение, стандарты и связанные товарные позиции. Подбор материала и аналога подтверждаем по техническому заданию.</span>
      </section>
      <MaterialsSearch />
      <DirectoryGroupNav groups={materialGroups.map((group) => [group.key, group.label] as const)} label="Группы материалов" />
      <section className="materials-directory">
        {materialGroups.map((group, groupIndex) => {
          const groupMaterials = materials.filter((material) => material.group === group.key)
          if (!groupMaterials.length) return null
          return <section className="materials-group" id={group.key} key={group.key}>
            <div className="materials-group-title"><span>{String(groupIndex + 1).padStart(2, '0')}</span><h2>{group.label}</h2><p>{groupMaterials.length} {groupMaterials.length === 1 ? 'материал' : 'материалов'}</p></div>
            <div className="standards-table materials-data-table" role="table" aria-label={`Материалы: ${group.label}`}>
              <div className="standards-table-head" role="row"><span role="columnheader">Марка</span><span role="columnheader">Наименование и применение</span><span role="columnheader">Группа</span><span aria-hidden="true" /></div>
              {groupMaterials.map((material) => <Link href={`/spravochnik-materialov/${material.slug}`} role="row" aria-label={`${material.designation}: ${material.name}`} key={material.slug}>
                <span className="standard-code" role="cell">{material.designation}</span>
                <span className="standards-table-description" role="cell"><h3>{material.name}</h3><p>{material.summary}</p></span>
                <small role="cell">{material.groupLabel}</small><b aria-hidden="true">→</b>
              </Link>)}
            </div>
          </section>
        })}
      </section>
      <section className="materials-note"><p>Важно</p><h2>Марка — только часть требования</h2><span>При подборе учитываем вид продукции, стандарт, состояние поставки, размеры, рабочую среду, температуру, давление, контроль и документы. Справочные аналоги не означают автоматическую взаимозаменяемость.</span><Link href="/#request">Подобрать материал по ТЗ ↗</Link></section>
    </main>
  )
}
