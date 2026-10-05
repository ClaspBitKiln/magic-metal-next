import type { Metadata, Viewport } from 'next'
import React from 'react'
import Analytics from '@/components/Analytics'
import './critical.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://magicmet.ru'),
  title: {
    default: 'Мэджик Металл — трубы, СДТ и металлопрокат для промышленности',
    template: '%s | Мэджик Металл',
  },
  description: 'Комплектные поставки электросварных и бесшовных труб, СДТ, труб и фасонных изделий в изоляции, специальных сталей и металлопроката.',
  icons: { icon: '/images/logo.png' },
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
  const fullCssHref = '/site.css?v=20261005'
  const organizationJsonLd = {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'ООО «Мэджик Металл»', url: 'https://magicmet.ru',
    email: 'm1@magicmet.ru', telephone: '+7 922 711-73-63', logo: 'https://magicmet.ru/images/logo-transparent-v2.png',
    contactPoint: [{ '@type': 'ContactPoint', telephone: '+7 922 711-73-63', contactType: 'sales', areaServed: ['RU', 'UZ', 'KZ', 'KG', 'BY', 'TR'], availableLanguage: ['Russian', 'Uzbek', 'Kazakh', 'Kyrgyz', 'Belarusian', 'Turkish', 'English'] }],
    areaServed: ['Россия', 'СНГ', 'Узбекистан'],
    knowsAbout: ['электросварные трубы', 'бесшовные трубы', 'соединительные детали трубопроводов', 'металлопрокат', 'нержавеющие стали', 'цветные металлы'],
  }
  const websiteJsonLd = {
    '@context': 'https://schema.org', '@type': 'WebSite', name: 'Мэджик Металл', url: 'https://magicmet.ru',
    potentialAction: { '@type': 'SearchAction', target: 'https://magicmet.ru/poisk?q={search_term_string}', 'query-input': 'required name=search_term_string' },
  }
  return (
    <html lang="ru">
      <head>
        <link id="full-site-css" rel="stylesheet" href={fullCssHref} media="print" suppressHydrationWarning />
        <script id="full-site-css-loader" dangerouslySetInnerHTML={{ __html: `(()=>{const l=document.getElementById('full-site-css');if(!l)return;const a=()=>{l.media='all'};l.addEventListener('load',a,{once:true});if(l.sheet)a()})()` }} />
        <noscript><link rel="stylesheet" href={fullCssHref} /></noscript>
      </head>
      <body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd]).replace(/</g, '\\u003c') }} />{children}<Analytics /></body>
    </html>
  )
}
