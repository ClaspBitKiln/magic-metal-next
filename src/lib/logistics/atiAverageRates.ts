export type AtiRouteConfig = {
  id: string
  origin: string
  destination: string
  mode: 'road' | 'rail' | 'sea' | 'multimodal'
  carType?: 'close' | 'open' | 'tent' | 'ref' | 'tral' | 'docker'
  tonnage?: 1.5 | 3 | 5 | 10 | 20
  withNds?: boolean
  roundTrip?: boolean
}

export type AtiRateSnapshot = {
  routeId: string
  origin: string
  destination: string
  dateFrom: string
  dateTo: string | null
  averagePriceRub: number
  lowerPriceRub: number
  upperPriceRub: number
  averagePricePerKm: number
  distanceKm: number
  loadsCount: number | null
  tonnage: number
  carType: string
  withNds: boolean
  source: 'ati-average-rates'
  evidenceLevel: 'observed'
  observedAt: string
}

type AtiDirection = {
  FromCityId?: number | null
  FromCity?: string | null
  ToCityId?: number | null
  ToCity?: string | null
  DirectionInfo?: Record<string, unknown> | null
}

type AtiDirectionsResponse = { AllDirections?: AtiDirection[] }
type AtiPricesResponse = {
  Data?: Array<{
    DateFrom: string
    DateTo?: string | null
    Prices?: { AveragePrice?: number; BottomPrice?: number; UpperPrice?: number }
    PricesInRub?: { AveragePrice?: number; BottomPrice?: number; UpperPrice?: number } | null
    LoadsCount?: number | null
  }>
  Distance?: number
  WithNDS?: boolean
}

const BASE_URL = 'https://api.ati.su'

const request = async <T>(path: string, token: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`ATI ${response.status}: ${body.slice(0, 500)}`)
  return JSON.parse(body) as T
}

const normalize = (value?: string | null) => value?.toLowerCase().replace(/ё/g, 'е').replace(/[, ]+рф$/i, '').trim() ?? ''

export async function fetchAtiAverageRates(token: string, routes: AtiRouteConfig[], date: string): Promise<AtiRateSnapshot[]> {
  if (!token) throw new Error('ATI_API_TOKEN is required')
  const directions = await request<AtiDirectionsResponse>('/priceline/license/v2/all_directions', token)
  const all = directions.AllDirections ?? []
  const snapshots: AtiRateSnapshot[] = []

  for (const route of routes) {
    const direction = all.find((item) => normalize(item.FromCity) === normalize(route.origin) && normalize(item.ToCity) === normalize(route.destination))
    if (!direction?.FromCityId || !direction.ToCityId) continue

    const payload = {
      From: { CityId: direction.FromCityId },
      To: { CityId: direction.ToCityId },
      CarType: route.carType ?? 'close',
      DateFrom: date,
      Frequency: 'day',
      WithNds: route.withNds ?? false,
      RoundTrip: route.roundTrip ?? false,
      Tonnage: route.tonnage ?? 20,
    }
    const result = await request<AtiPricesResponse>('/priceline/license/v1/average_prices', token, { method: 'POST', body: JSON.stringify(payload) })
    const row = result.Data?.[0]
    const averagePriceRub = row?.PricesInRub?.AveragePrice
    if (averagePriceRub === undefined || result.Distance === undefined) continue

    snapshots.push({
      routeId: route.id,
      origin: route.origin,
      destination: route.destination,
      dateFrom: row.DateFrom,
      dateTo: row.DateTo ?? null,
      averagePriceRub,
      lowerPriceRub: row.PricesInRub?.BottomPrice ?? averagePriceRub,
      upperPriceRub: row.PricesInRub?.UpperPrice ?? averagePriceRub,
      averagePricePerKm: row.Prices?.AveragePrice ?? (averagePriceRub / result.Distance),
      distanceKm: result.Distance,
      loadsCount: row.LoadsCount ?? null,
      tonnage: route.tonnage ?? 20,
      carType: route.carType ?? 'close',
      withNds: result.WithNDS ?? (route.withNds ?? false),
      source: 'ati-average-rates',
      evidenceLevel: 'observed',
      observedAt: new Date().toISOString(),
    })
  }
  return snapshots
}
