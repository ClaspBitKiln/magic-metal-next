#!/usr/bin/env node
// Offline, read-only bottleneck selection from aggregate Metrika funnel counts.
// No PII, LLM API, publication, or automatic site changes.
import { readFile, writeFile, chmod } from 'node:fs/promises'
const [source, target] = process.argv.slice(2)
if (!source || !target) { console.error('Usage: node scripts/growth/prioritize-funnel.mjs <aggregate.json> <report.json>'); process.exit(2) }
const input = JSON.parse(await readFile(source,'utf8'))
const steps = ['product_visits','request_click_visits','request_started_visits','request_sent_visits']
const errors = []
for (const key of steps) if (!Number.isSafeInteger(input[key]) || input[key] < 0) errors.push(key+' must be nonnegative integer')
if (!errors.length && steps.some((key,i)=>i>0 && input[key] > input[steps[i-1]])) errors.push('These are not comparable, nested visit cohorts')
if (!input.source || input.source !== 'metrika_aggregated_visits') errors.push('source must be metrika_aggregated_visits')
if (!input.period || !/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(input.period)) errors.push('period must be YYYY-MM-DD/YYYY-MM-DD')
if (input.robot_filter !== 'excluded') errors.push('Robot traffic must be excluded')
if (input.cohort_verified !== true) errors.push('Visit cohort comparability must be independently verified')
if (input.unit !== 'distinct_visits') errors.push('Counts must be distinct visits, never event reaches or pageviews')
if (input.goal_semantics_verified !== true) errors.push('Goal semantics must be checked against client and server behavior')
if (input.excludes_internal_qa !== true) errors.push('Internal QA visits must be excluded')
if (input.source_report_id === undefined || typeof input.source_report_id !== 'string' || !/^[a-zA-Z0-9_.-]{6,100}$/.test(input.source_report_id)) errors.push('Non-sensitive source_report_id is required for traceability')
const minimum = 30
const report = { period:input.period ?? null, source:'aggregated visit cohort', source_report_id: typeof input.source_report_id === 'string' && /^[a-zA-Z0-9_.-]{6,100}$/.test(input.source_report_id) ? input.source_report_id : null, cohort_type:'nested_visit_cooccurrence', temporal_order_verified:false, automatic_site_edits:false, verification_status:'requires_human_review', errors, recommendations:[] }
if (!errors.length) {
  if (input.product_visits < minimum) {
    report.errors.push('Insufficient sample: fewer than 30 product visits')
  } else {
    const labels=['Товар → нажатие «В заявку»','Нажатие → начало заполнения','Начало заполнения → подтверждённая отправка']
    for(let i=0;i<3;i++) {
      const from=input[steps[i]],to=input[steps[i+1]]
      const lost=from-to
      report.recommendations.push({stage:labels[i],from_visits:from,to_visits:to,dropoff_visits:lost,dropoff_rate:from?Number((lost/from).toFixed(4)):null,eligible:from>=minimum})
    }
    report.recommendations.sort((a,b)=>b.dropoff_visits-a.dropoff_visits)
    report.primary_constraint=report.recommendations.find(x=>x.eligible) ?? null
    report.warning='Observed attrition is not proof of causation; check sources, devices, sessions, lead quality and CRM before changing UX. Nested co-occurrence does not establish event order.'
  }
}
await writeFile(target,JSON.stringify(report,null,2)+'\n',{encoding:'utf8',mode:0o600})
await chmod(target,0o600)
console.log(JSON.stringify({ready:!report.errors.length,primary_constraint:report.primary_constraint?.stage ?? null,errors:report.errors}))
if(report.errors.length) process.exitCode=1

