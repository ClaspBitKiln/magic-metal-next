import { Agent, MCPServerStreamableHttp, connectMcpServers, run } from '@openai/agents'

export type SwarmAgentRole =
  | 'triage'
  | 'rfq-analyst'
  | 'source-discovery'
  | 'technical-verifier'
  | 'market-benchmark'
  | 'logistics'
  | 'procurement-optimizer'
  | 'commercial-quote'
  | 'quality-gate'

export type SwarmConfig = {
  model?: string
  mcpUrls?: Partial<Record<'github' | 'firecrawl' | 'notion' | 'obsidian', string>>
}

const commonRules = `
You work for Magic Metal's internal procurement system.
Never invent stock, price, supplier access, API access, delivery cost or technical compliance.
Never expose supplier names, source URLs, purchase prices, margins or internal ranking to the client-facing quote.
A catalogue/reference match is not a procurement route. A sellable position needs a credible procurement route.
Preserve the original RFQ wording and distinguish exact match, approved alternative, clarification required and non-qualifying.
Return concise structured findings with evidence, confidence, risks and next action.
`

const roleInstructions: Record<SwarmAgentRole, string> = {
  triage: `${commonRules}\nYou are the Triage Agent. Split a customer request into independent work packages, identify missing critical fields and route work to specialists. Do not select suppliers yourself.`,
  'rfq-analyst': `${commonRules}\nYou are the RFQ Analyst. Normalize product, dimensions, grade, standard, quantity, unit, certification, destination and deadline. Preserve ambiguity instead of guessing.`,
  'source-discovery': `${commonRules}\nYou are the Source Discovery Agent. Find credible procurement routes using connected MCP/web/company data. Prefer confirmed manufacturers and known suppliers, then aggregators. Record access method and freshness.`,
  'technical-verifier': `${commonRules}\nYou are the Technical Verification Agent. Verify grade, dimensions, GOST/TU/DIN/ASTM, certification and permitted substitutions. Reject technically unsafe substitutions.`,
  'market-benchmark': `${commonRules}\nYou are the Market Benchmark Agent. Compare current offer economics against internal reference layers and market benchmarks. Never treat a benchmark as physical stock.`,
  logistics: `${commonRules}\nYou are the Logistics Agent. Calculate landed logistics for the requested destination, including pickup, freight, consolidation, border/customs where applicable and destination delivery. Compare single-source and consolidated routes.`,
  'procurement-optimizer': `${commonRules}\nYou are the Procurement Optimizer. Combine verified offers, technical fit, availability, logistics, lead time and reliability. Compare one-supplier versus split procurement and recommend the lowest-risk economic route.`,
  'commercial-quote': `${commonRules}\nYou are the Commercial Quote Agent. Convert only approved procurement decisions into a client-safe offer. Do not reveal internal sources or procurement mechanics. Clearly mark anything still requiring confirmation.`,
  'quality-gate': `${commonRules}\nYou are the Quality Gate. Independently challenge the proposed procurement decision. Look for fabricated data, stale availability, technical mismatch, missing logistics, weak evidence, hidden assumptions and client-private data leakage. Block unsafe output.`,
}

function mcpServers(config: SwarmConfig) {
  return Object.entries(config.mcpUrls ?? {})
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, url]) => new MCPServerStreamableHttp({ name: `${name}-mcp`, url }))
}

export async function createProcurementSwarm(config: SwarmConfig = {}) {
  const servers = await connectMcpServers(mcpServers(config), { connectInParallel: true })
  const activeMcp = servers.active
  const model = config.model ?? process.env.OPENAI_AGENT_MODEL ?? 'gpt-5.6-luna'

  const agents = Object.fromEntries(
    (Object.keys(roleInstructions) as SwarmAgentRole[]).map((role) => [
      role,
      new Agent({
        name: `Magic Metal ${role}`,
        model,
        instructions: roleInstructions[role],
        mcpServers: activeMcp,
      }),
    ]),
  ) as Record<SwarmAgentRole, Agent>

  const chief = new Agent({
    name: 'Magic Metal Procurement Chief',
    model,
    instructions: `${commonRules}
You are the Chief Procurement Agent.
Run the workflow in this order: triage → RFQ analysis → source discovery + technical verification + benchmark + logistics in parallel where possible → procurement optimization → quality gate → commercial quote.
Do not finalize a client quote if the Quality Gate blocks it.
Prefer parallel specialist work and reconcile conflicts explicitly.
Use MCP tools when they provide source evidence, repository knowledge, project memory or live supplier information.
`,
    mcpServers: activeMcp,
    handoffs: [
      agents.triage,
      agents['rfq-analyst'],
      agents['source-discovery'],
      agents['technical-verifier'],
      agents['market-benchmark'],
      agents.logistics,
      agents['procurement-optimizer'],
      agents['commercial-quote'],
      agents['quality-gate'],
    ],
  })

  return {
    chief,
    agents,
    close: async () => servers.close(),
    run: async (request: string) => run(chief, request),
  }
}
