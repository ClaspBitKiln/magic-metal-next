import { searchDimensionTables } from '@/lib/dimensionSearch'

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') || ''
  if (!query.trim() || query.length > 200) return Response.json({ error: 'Введите запрос длиной до 200 символов.' }, { status: 400 })
  return Response.json({ items: searchDimensionTables(query) }, { headers: { 'Cache-Control': 'public, s-maxage=300' } })
}
