'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Мэджик Металл — главная"><Image src="/images/logo.png" alt="Мэджик Металл" width={147} height={109} loading="eager" fetchPriority="high" unoptimized /></a>
      <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Основная навигация">
        <a href="#about" onClick={() => setMenuOpen(false)}>О компании</a><a href="#products" onClick={() => setMenuOpen(false)}>Продукция</a><Link href="/spravochnik-gost">Справочник ГОСТ</Link><a href="#contacts" onClick={() => setMenuOpen(false)}>Контакты</a>
      </nav>
      <div className="top-actions">
        <a className="phone" href="tel:+79227117363">+7 922 711-73-63</a>
        <LanguageSwitcher />
        <a className="top-cta" href="#request"><span className="top-cta-label top-cta-label-full">Отправить заявку</span><span className="top-cta-label top-cta-label-short">Заявка</span><span className="top-cta-arrow" aria-hidden="true">↗</span></a>
        <button className="menu-button" type="button" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /><span /></button>
      </div>
    </header>
  )
}
