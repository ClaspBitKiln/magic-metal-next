import type { AgentResult, AgentTask, Evidence, NextAction } from '../agents/contracts'
import { runProcurement, type ProcurementAdapter, type ProcurementResult } from './engine'

export type ProcurementAgentOutput = ProcurementResult

export function createProcurementTask(text: string, workflowId = crypto.randomUUID()): AgentTask<{ rfqText: string }> {
  return {
    taskId: crypto.randomUUID(),
    workflowId,
    agent: 'orchestrator',
    input: { rfqText: text },
    constraints: [
      'Не менять исходную заявку без фиксации нормализации',
      'Не считать справочный источник реальным procurement route',
      'Не раскрывать клиенту внутренние supplier/source данные',
    ],
    createdAt: new Date().toISOString(),
    attempt: 1,
  }
}

export async function runProcurementAgentFlow(
  task: AgentTask<{ rfqText: string }>,
  adapters: ProcurementAdapter[],
): Promise<AgentResult<ProcurementAgentOutput>> {
  const result = await runProcurement(task.input.rfqText, adapters)
  const evidence: Evidence[] = [
    {
      id: `${task.taskId}:normalized`,
      level: 'inferred',
      sourceType: 'client',
      claim: 'RFQ normalized from the original client text.',
      observedAt: result.rfq.parsedAt,
    },
  ]
  const warnings = result.noRouteLines.map((line) => ({
    code: 'no-procurement-route' as const,
    message: `Для строки ${line} не найден реальный маршрут закупки.`,
    severity: 'critical' as const,
    itemId: String(line),
  }))
  const clarificationWarnings = result.clarificationLines.map((line) => ({
    code: 'client-clarification-required' as const,
    message: `Для строки ${line} недостаточно технических данных для надежного выбора.`,
    severity: 'warning' as const,
    itemId: String(line),
  }))
  warnings.push(...clarificationWarnings)

  const nextAction: NextAction | undefined = result.noRouteLines.length
    ? { agent: 'supplier-discovery', action: 'Найти и подтвердить дополнительный procurement route.', reason: 'Нет реального маршрута закупки.', required: true }
    : result.clarificationLines.length
      ? { agent: 'human', action: 'Уточнить обязательные параметры заявки.', reason: 'Технических данных недостаточно.', required: true }
      : undefined

  return {
    taskId: task.taskId,
    workflowId: task.workflowId,
    agent: 'orchestrator',
    status: warnings.some((warning) => warning.severity === 'critical') ? 'blocked' : nextAction ? 'needs_clarification' : 'completed',
    output: result,
    evidence,
    confidence: warnings.length ? 'medium' : 'high',
    warnings,
    nextAction,
    completedAt: new Date().toISOString(),
  }
}
