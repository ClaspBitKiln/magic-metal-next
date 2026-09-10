export type KnowledgeRecord = {
  product: string
  supplier?: string
  purchasePrice?: number
  actualLeadTimeDays?: number
  result: 'success' | 'failure'
  recordedAt: string
}

/** Keeps only useful facts from a completed procurement. */
export function recordKnowledge(input: Omit<KnowledgeRecord, 'recordedAt'>, now = new Date()): KnowledgeRecord {
  return { ...input, recordedAt: now.toISOString() }
}
