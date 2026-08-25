import type { Metadata, Viewport } from 'next'
import React from 'react'
import Analytics from '@/components/Analytics'
import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://magicmet.ru'),
  title: {
    default: 'Мэджик Металл — трубы, СДТ и металлопрокат для промышленности',
    template: '%s | Мэджик Металл',
  },
  description: 'Комплектные поставки электросварных и бесшовных труб, СДТ, труб и фасонных изделий в изоляции, специальных сталей и металлопроката.',
  openGraph: {
    title: 'Мэджик Металл — комплексные поставки металла',
    description: 'Находим редкие и нестандартные позиции, проверяем ГОСТ, ТУ и документы, комплектуем поставки металла для промышленности.',
    images: ['/images/hero-mercedes-v5.webp'],
    locale: 'ru_RU',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071c62',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'ООО «Мэджик Металл»', url: 'https://magicmet.ru',
    email: 'm1@magicmet.ru', telephone: '+7 922 711-73-63', logo: 'https://magicmet.ru/images/logo-transparent-v2.png',
    areaServed: ['Россия', 'СНГ', 'Узбекистан'],
    knowsAbout: ['электросварные трубы', 'бесшовные трубы', 'соединительные детали трубопроводов', 'металлопрокат', 'нержавеющие стали', 'цветные металлы'],
  }
  return (
    <html lang="ru">
      <body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c') }} />{children}<Analytics /></body>
    </html>
  )
}
