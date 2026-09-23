import { getPayload } from 'payload'
import config from '@/payload.config'
import { normalizeMetalName } from './normalize'

let payloadPromise: ReturnType<typeof getPayload> | null = null
async function db() {
  if (!payloadPromise) payloadPromise = getPayload({ config })
  return payloadPromise
}
function obj(x:any){ return x && typeof x === 'object' ? x : {} }
function first(...xs:any[]){ return xs.find(x => x !== undefined && x !== null && x !== '') ?? null }

export async function persistTender(raw:any, externalId:string) {
  const p = await db()
  const root = obj(raw?.data ?? raw)
  const customer = obj(root.customer)
  const price = obj(root.price)
  const place = obj(root.place)
  const regions = Array.isArray(root.regions) ? root.regions : []
  const title = String(first(root.title, root.name, root.descr, 'Без названия'))
  const existing = await p.find({ collection:'komtender-tenders', where:{ externalId:{equals:externalId}}, limit:1 })
  const data:any = {
    externalId,
    eisNumber: first(root.eis, root.eisNumber),
    title,
    customerName: first(customer.name, customer.title),
    customerInn: first(customer.inn, customer.INN),
    startPrice: first(price.value, root.startPrice, root.price),
    currency: first(price.currency, 'RUB'),
    publishedAt: first(root.dts, root.publishedAt),
    deadline: first(root.dte, root.deadline),
    region: first(regions[0], place.region),
    city: first(root.cities?.[0], place.city),
    stage: first(root.stage),
    purchaseType: first(root.type),
    etp: first(root.etp, root.placement?.source),
    url: first(root.url),
    rawJson: root,
    collectedAt: new Date().toISOString(),
  }
  const tender = existing.docs[0]
    ? await p.update({collection:'komtender-tenders',id:existing.docs[0].id,data})
    : await p.create({collection:'komtender-tenders',data})
  const positions = Array.isArray(root.positions) ? root.positions : []
  for (const pos of positions) {
    const name = String(first(pos.name, pos.title, ''))
    if (!name) continue
    const n = normalizeMetalName(name, first(pos.unit, null), typeof pos.quantity === 'number' ? pos.quantity : null)
    await p.create({collection:'komtender-positions',data:{
      tender:tender.id, sourceName:name, normalizedName:[n.category,n.grade,n.diameter_mm ? 'Ø'+n.diameter_mm : null].filter(Boolean).join(' '),
      category:n.category, grade:n.grade, diameterMm:n.diameter_mm, thicknessMm:n.thickness_mm,
      widthMm:n.width_mm, lengthMm:n.length_mm, gost:n.gost, unit:n.unit, quantity:n.quantity,
      unitPrice:first(pos.price, pos.unitPrice), totalPrice:first(pos.total, pos.totalPrice),
      classifier:pos.classifier ?? null, normalizedConfidence:n.confidence
    }})
  }
  return tender
}
