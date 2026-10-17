export type SizeSeries = {
  kind?: 'dimensions' | 'requirements'
  categorySlug: string
  productSlug: string
  title: string
  standard: string
  scope: string
  summary?: string
  columns: string[]
  rows: string[][]
  notes: string[]
  source: { label: string; url: string }
}
