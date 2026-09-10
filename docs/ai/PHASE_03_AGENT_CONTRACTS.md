# Phase 3 — Agent Contracts

## Goal
Create one machine-readable protocol for the procurement swarm. Agents exchange typed tasks/results rather than free-form prompts.

## Canonical flow

`Orchestrator → AgentTask → AgentResult → Evidence → Confidence → Warnings → NextAction`

The Orchestrator remains responsible for workflow state and routing. Agents do not silently change customer requirements or upgrade evidence.

## AgentTask

Required:
- `taskId`
- `workflowId`
- `agent`
- `input`
- `constraints`
- `createdAt`
- `attempt`

Optional:
- `parentTaskId`
- `deadline`

## AgentResult

Required:
- `taskId`
- `workflowId`
- `agent`
- `status`
- `output`
- `evidence[]`
- `confidence`
- `warnings[]`
- `completedAt`

Optional:
- `nextAction`

## Evidence

Levels are ordered:

`unknown < inferred < reference < observed < confirmed`

An agent cannot upgrade evidence merely by repeating or interpreting the same data. A higher level requires new supporting evidence.

Every important claim should carry an evidence record with source type, source reference where available, observation time and optional expiry.

## Confidence

- `high`: decision can normally proceed within stated constraints.
- `medium`: usable with explicit warning or verification step.
- `low`: discovery/working hypothesis only.
- `none`: insufficient information for a decision.

Confidence is not evidence. A confident inference remains `inferred` evidence.

## Warnings

Warnings are structured and machine-actionable. Important codes include:
- missing-field
- technical-mismatch
- unverified-source
- stale-data
- no-procurement-route
- price-missing
- availability-uncertain
- logistics-uncertain
- split-required
- client-clarification-required
- policy-blocked

`critical` warnings block downstream approval unless explicitly resolved by the Orchestrator/human.

## NextAction

Every unresolved dependency should point to the responsible next agent or human and state why it is needed. This prevents agents from looping or independently making the next decision.

## Client boundary

Client-safe output contains only product/technical characteristics, quantity, selling price, currency, delivery terms and delivery status/term.

The following are internal and must never cross the client boundary:
- supplier/source identity
- source URL
- purchase price
- internal margin
- ranking score
- internal offer IDs
- reliability score
- internal notes

## Implementation

Canonical TypeScript contract: `src/lib/agents/contracts.ts`.

Contract tests: `tests/int/agent-contracts.int.spec.ts`.

This contract is the interface layer for the next Procurement Engine stages. Do not create role-specific incompatible payloads.
