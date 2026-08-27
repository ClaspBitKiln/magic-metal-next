import type { Metadata } from 'next'
import Link from 'next/link'

import { standardGroups, standards } from '@/data/standards'
import '../spravochnik-materialov/materials.css'

export const metadata: Metadata = {
  title: 'Справочник ГОСТ и стандартов на металлопрокат',
  description: 'ГОСТы на трубы, СДТ, стали и цветные металлы: область применения, что проверить в заявке, связанные материалы и продукция.',
  alternates: { canonical: '/spravochnik-gost' },
}

export default function StandardsDirectoryPage() {
  return <main className="materials-page">
    <header className="materials-header"><Link href="/"><b>←</b> Мэджик Металл</Link><Link className="materials-cta" href="/#request">Отправить заявку ↗</Link></header>
    <section className="materials-hero"><p>Справочник · нормативные документы</p><h1>ГОСТ<br /><em>и стандарты</em></h1><span>Не просто номера документов: область применения, связь с материалами и продукцией, параметры, которые важно указать для корректного расчёта.</span></section>
    <nav className="materials-groups" aria-label="Группы стандартов">{standardGroups.map(([key, label]) => <a href={`#${key}`} key={key}>{label}</a>)}</nav>
    <section className="materials-directory">
      {standardGroups.map(([key, label], groupIndex) => {
        const items = standards.filter((standard) => standard.group === key)
        if (!items.length) return null
        return <section className="materials-group" id={key} key={key}>
          <div className="materials-group-title"><span>{String(groupIndex + 1).padStart(2, '0')}</span><h2>{label}</h2><p>{items.length} документов</p></div>
          <div className="materials-grid">{items.map((standard) => <Link href={`/spravochnik-gost/${standard.slug}`} key={standard.slug}><span className="standard-code">{standard.code}</span><h3>{standard.title}</h3><p>{standard.summary}</p><b>Область применения →</b></Link>)}</div>
        </section>
      })}
    </section>
    <section className="materials-note"><p>Подбор по нормативной документации</p><h2>Одного номера ГОСТ недостаточно</h2><span>Для расчёта уточняем стандарт на сортамент и технические условия, марку, размеры, состояние поставки, испытания, контроль и документы.</span><Link href="/#request">Отправить заявку ↗</Link></section>
  </main>
}
