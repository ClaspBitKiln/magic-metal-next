import type { MetadataRoute } from 'next'
import { seoCatalog } from '@/data/seoCatalog'
import { materials } from '@/data/materials'
import { standards } from '@/data/standards'
import { sdtCatalog } from '@/data/sdtCatalog'
import { pipeCatalog } from '@/data/pipeCatalog'
import { productDetailCatalog } from '@/data/productDetailCatalog'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://magicmet.ru'
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/poisk`, changeFrequency: 'weekly', priority: .8 },
    { url: `${base}/kalkulyator-metalla`, changeFrequency: 'monthly', priority: .8 },
    { url: `${base}/spravochnik-materialov`, changeFrequency: 'weekly', priority: .9 },
    { url: `${base}/spravochnik-gost`, changeFrequency: 'weekly', priority: .9 },
    { url: `${base}/postavki/uzbekistan`, changeFrequency: 'monthly', priority: .85 },
    ...seoCatalog.map(({ slug }) => ({ url: `${base}/produkciya/${slug}`, changeFrequency: 'monthly' as const, priority: .8 })),
    ...sdtCatalog.map(({ slug }) => ({ url: `${base}/produkciya/sdt/${slug}`, changeFrequency: 'monthly' as const, priority: .82 })),
    ...pipeCatalog.map(({ categorySlug, slug }) => ({ url: `${base}/produkciya/${categorySlug}/${slug}`, changeFrequency: 'monthly' as const, priority: .84 })),
    ...productDetailCatalog.map(({ categorySlug, slug }) => ({ url: `${base}/produkciya/${categorySlug}/${slug}`, changeFrequency: 'monthly' as const, priority: .8 })),
    ...materials.map(({ slug }) => ({ url: `${base}/spravochnik-materialov/${slug}`, changeFrequency: 'monthly' as const, priority: .75 })),
    ...standards.map(({ slug }) => ({ url: `${base}/spravochnik-gost/${slug}`, changeFrequency: 'monthly' as const, priority: .75 })),
  ]
}
