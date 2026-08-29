import type { Metadata } from 'next'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'

import MetalCalculator from '@/components/MetalCalculator'
import './calculator.css'

export const metadata: Metadata = {
  title: 'Калькулятор веса металла — труба, лист, круг, квадрат',
  description: 'Рассчитать теоретическую массу трубы, листа, круга и квадрата из стали, нержавейки, алюминия, меди, латуни, бронзы или титана.',
  alternates: { canonical: '/kalkulyator-metalla' },
}

export default function MetalCalculatorPage() {
  return <main className="calculator-page">
    <header className="calculator-header"><Link href="/"><b>←</b> На главную</Link><LanguageSwitcher /><Link href="/poisk">Поиск по каталогу ↗</Link></header>
    <section className="calculator-hero"><p>Инженерный инструмент</p><h1>Калькулятор<br /><em>массы металла</em></h1><span>Быстрый теоретический расчёт трубы, листа, круга и квадрата для предварительной оценки заявки.</span></section>
    <MetalCalculator />
    <section className="calculator-info"><p>Как используется результат</p><h2>Масса помогает оценить логистику, но не заменяет спецификацию</h2><div><span>01</span><p>Выберите форму и материал.</p><span>02</span><p>Введите размеры и количество.</p><span>03</span><p>Передайте расчёт вместе с маркой, ГОСТом и городом доставки.</p></div></section>
  </main>
}
