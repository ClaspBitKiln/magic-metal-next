import fs from 'node:fs'
import path from 'node:path'
import type { LogisticsRoute } from './types'

type RouteRecord = LogisticsRoute & {
  observedAt?: string
  evidenceUrl?: string
  evidenceNote?: string
  status: LogisticsRoute['status']
}

export function loadLogisticsRoutes(): LogisticsRoute[] {
  const file = path.join(process.cwd(), 'private/data/logistics-routes.json')
  const document = JSON.parse(fs.readFileSync(file, 'utf8')) as { routes?: RouteRecord[] }
  return (document.routes ?? []).map((route) => ({
    ...route,
    observedAt: route.observedAt ?? new Date(0).toISOString(),
    confidence: route.confidence ?? (route.status === 'verified' ? 0.95 : 0.5),
  }))
}

export function loadVerifiedLogisticsRoutes(): LogisticsRoute[] {
  return loadLogisticsRoutes().filter((route) => route.status === 'verified')
}
