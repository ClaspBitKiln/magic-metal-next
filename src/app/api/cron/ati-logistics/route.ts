import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { fetchAtiAverageRates, type AtiRouteConfig } from '@/lib/logistics/atiAverageRates'

export const dynamic = 'force-dynamic'

const yesterday = () => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const token = process.env.ATI_API_TOKEN
  if (!token) return Response.json({ error: 'ATI_API_TOKEN is not configured' }, { status: 503 })

  const file = path.join(process.cwd(), 'private/data/ati-routes.json')
  const source = JSON.parse(fs.readFileSync(file, 'utf8')) as { routes: AtiRouteConfig[] }
  const snapshots = await fetchAtiAverageRates(token, source.routes, yesterday())
  const payload = await getPayload({ config })

  for (const snapshot of snapshots) {
    const existing = await payload.find({ collection: 'logistics-benchmarks', where: { and: [{ routeId: { equals: snapshot.routeId } }, { dateFrom: { equals: snapshot.dateFrom } }, { source: { equals: snapshot.source } }] }, limit: 1 })
    const data = {
      ...snapshot,
      dateFrom: new Date(snapshot.dateFrom).toISOString(),
      dateTo: snapshot.dateTo ? new Date(snapshot.dateTo).toISOString() : undefined,
    }
    if (existing.docs[0]) await payload.update({ collection: 'logistics-benchmarks', id: existing.docs[0].id, data })
    else await payload.create({ collection: 'logistics-benchmarks', data })
  }

  return Response.json({ source: 'ati-average-rates', date: yesterday(), updated: snapshots.length, routes: snapshots.map((snapshot) => snapshot.routeId) })
}
