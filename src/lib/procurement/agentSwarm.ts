import type { NormalizedRFQ, Offer, ProcurementDecision } from './types'
import { rankOffers } from './ranking'

export type AgentRole =
  | 'coordinator'
  | 'technical'
  | 'source-discovery'
  | 'price'
  | 'logistics'
  | 'risk'
  | 'procurement'
  | 'quote'

export type AgentFinding = {
  agent: AgentRole
  status: 'pass' | 'warn' | 'block'
  message: string
  data?: Record<string, unknown>
}

export type AgentContext = {
  rfq: NormalizedRFQ
  offers: Offer[]
  decisions?: ProcurementDecision[]
  findings: AgentFinding[]
}

export type Agent = {
  role: AgentRole
  priority: number
  run: (context: AgentContext) => Promise<AgentFinding[]>
}

const technicalAgent: Agent = {
  role: 'technical', priority: 10,
  async run({ rfq }) {
    return rfq.items.flatMap((item) => {
      const missing = ['grade', 'standard'].filter((key) => item[key as 'grade' | 'standard'].confidence === 'missing')
      return missing.length
        ? [{ agent: 'technical', status: 'warn', message: `Позиция ${item.line}: отсутствуют ${missing.join(', ')}.` }]
        : [{ agent: 'technical', status: 'pass', message: `Позиция ${item.line}: ключевые технические поля заполнены.` }]
    })
  },
}

const sourceDiscoveryAgent: Agent = {
  role: 'source-discovery', priority: 20,
  async run({ offers }) {
    return offers.length
      ? [{ agent: 'source-discovery', status: 'pass', message: `Найдено предложений: ${offers.length}.` }]
      : [{ agent: 'source-discovery', status: 'block', message: 'Подтверждённый маршрут закупки не найден.' }]
  },
}

const priceAgent: Agent = {
  role: 'price', priority: 30,
  async run({ offers }) {
    const priced = offers.filter((offer) => Number.isFinite(offer.price))
    if (!priced.length) return [{ agent: 'price', status: 'block', message: 'Нет предложений с ценой.' }]
    const prices = priced.map((offer) => offer.price as number)
    return [{ agent: 'price', status: 'pass', message: `Диапазон цен: ${Math.min(...prices)}–${Math.max(...prices)}.` }]
  },
}

const logisticsAgent: Agent = {
  role: 'logistics', priority: 40,
  async run({ offers }) {
    const withoutFreight = offers.filter((offer) => offer.freightCost === undefined)
    return withoutFreight.length
      ? [{ agent: 'logistics', status: 'warn', message: `${withoutFreight.length} предложений требуют расчёта доставки.` }]
      : [{ agent: 'logistics', status: 'pass', message: 'Логистические расходы присутствуют в предложениях.' }]
  },
}

const riskAgent: Agent = {
  role: 'risk', priority: 50,
  async run({ offers }) {
    const risks = offers.filter((offer) => offer.availability === 'unknown' || offer.match === 'clarification-required')
    return risks.length
      ? [{ agent: 'risk', status: 'warn', message: `Требуют дополнительной проверки: ${risks.length}.` }]
      : [{ agent: 'risk', status: 'pass', message: 'Критических сигналов риска в предложениях не обнаружено.' }]
  },
}

const procurementAgent: Agent = {
  role: 'procurement', priority: 60,
  async run(context) {
    const decisions = rankOffers(context.offers)
    context.decisions = decisions
    const winner = decisions.find((decision) => decision.recommended) ?? decisions[0]
    return winner
      ? [{ agent: 'procurement', status: winner.risks.length ? 'warn' : 'pass', message: `Рекомендуется offer ${winner.offerId}; score ${winner.score.toFixed(3)}.`, data: { offerId: winner.offerId, score: winner.score, landedCost: winner.landedCost.total } }]
      : [{ agent: 'procurement', status: 'block', message: 'Закупочное решение не сформировано.' }]
  },
}

const quoteAgent: Agent = {
  role: 'quote', priority: 70,
  async run({ decisions }) {
    const winner = decisions?.find((decision) => decision.recommended)
    return winner && winner.risks.length === 0
      ? [{ agent: 'quote', status: 'pass', message: 'Позиция готова к формированию клиентского КП.' }]
      : [{ agent: 'quote', status: 'warn', message: 'КП не фиксируется автоматически: требуется внутреннее подтверждение.' }]
  },
}

export const procurementAgents: Agent[] = [technicalAgent, sourceDiscoveryAgent, priceAgent, logisticsAgent, riskAgent, procurementAgent, quoteAgent]

export async function runAgentSwarm(context: AgentContext, agents = procurementAgents): Promise<AgentContext> {
  const ordered = [...agents].sort((a, b) => a.priority - b.priority)
  for (const agent of ordered) {
    const findings = await agent.run(context)
    context.findings.push(...findings)
    if (findings.some((finding) => finding.status === 'block')) break
  }
  return context
}
