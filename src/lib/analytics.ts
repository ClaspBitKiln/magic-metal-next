/** Only event names cross into the counter; never form values or file names. */
export function trackAnalyticsGoal(goal: string) {
  document.dispatchEvent(new CustomEvent('magicmet:goal', { detail: goal }))
}

export function isRecordedRequest(result: unknown): boolean {
  if (!result || typeof result !== 'object') return false
  const record = result as Record<string, unknown>
  return record.ok === true && (typeof record.id === 'number' || (typeof record.id === 'string' && record.id.length > 0) || record.emailDelivered === true || record.crmDelivered === true)
}
