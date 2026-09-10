# Magic Metal Procurement Agent Swarm

## Purpose

A multi-agent layer sits above the deterministic Procurement Engine. Agents investigate, verify and challenge procurement decisions; deterministic code remains the authority for normalization, landed-cost arithmetic, ranking and client-private/public boundaries.

## Roles

| Agent | Responsibility | Can block? |
|---|---|---:|
| Chief | Orchestration, reconciliation, final workflow | Yes |
| Triage | Split RFQ into work packages | Yes |
| RFQ Analyst | Normalize requirements and ambiguity | Yes |
| Source Discovery | Find real procurement routes | Yes |
| Technical Verifier | Verify grade/standard/dimensions/substitution | Yes |
| Market Benchmark | Benchmark price and market context | No |
| Logistics | Calculate route and landed logistics | Yes |
| Procurement Optimizer | Single vs split sourcing and best route | Yes |
| Commercial Quote | Client-safe commercial output | No |
| Quality Gate | Independent adversarial review | Yes |

## MCP/tool policy

The swarm supports Streamable HTTP MCP servers through environment-configured endpoints. Typical bindings are:

- GitHub — repository, code, issues, CI and technical source of truth.
- Firecrawl — supplier/manufacturer web research and fresh source extraction.
- Notion — business/project memory and operating knowledge.
- Obsidian gateway — controlled local knowledge base and project memory.

No MCP endpoint or credential is hard-coded. A missing connector is a missing evidence channel, not a reason to fabricate data.

## Workflow

`customer RFQ → triage → normalize → parallel discovery/technical/benchmark/logistics → optimizer → quality gate → client-safe quote`

The deterministic engine remains the calculation authority. Agents provide evidence, interpretation, research and challenge.

## Anti-hallucination gates

1. No source = no procurement route.
2. Benchmark ≠ stock.
3. Market listing ≠ confirmed availability.
4. Technical alternative requires explicit approval.
5. Unknown logistics cannot be silently set to zero.
6. Client output cannot contain supplier/source/purchase-price/margin fields.
7. Quality Gate can block a quote.

## Current implementation

`src/lib/agents/procurementSwarm.ts` implements the role registry, Chief orchestration, MCP server connections and specialist handoffs using the OpenAI Agents SDK.

The implementation follows the current Agents SDK model of agents, handoffs, MCP tools and tracing rather than building a parallel orchestration framework.
