import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
const base={source:'metrika_aggregated_visits',period:'2026-10-01/2026-10-31',robot_filter:'excluded',cohort_verified:true,product_visits:100,request_click_visits:60,request_started_visits:50,request_sent_visits:20}
async function run(input) {
 const dir=await mkdtemp(join(tmpdir(),'funnel-test-'))
 try {
  const src=join(dir,'data.json'),dst=join(dir,'out.json')
  await writeFile(src,JSON.stringify(input))
  const result=spawnSync(process.execPath,['scripts/growth/prioritize-funnel.mjs',src,dst],{encoding:'utf8'})
  return {status:result.status,data:JSON.parse(await readFile(dst,'utf8'))}
 } finally {await rm(dir,{recursive:true,force:true})}
}
test('identifies largest comparable attrition and never edits site',async()=>{
 const r=await run(base);assert.equal(r.status,0);assert.equal(r.data.primary_constraint.stage,'Товар → нажатие «В заявку»');assert.equal(r.data.automatic_site_edits,false)
})
test('refuses inconsistent visit cohort',async()=>{
 const r=await run({...base,request_started_visits:90});assert.equal(r.status,1);assert.ok(r.data.errors.some(x=>x.includes('not comparable')))
})
test('refuses robots and weak sample',async()=>{
 const robots=await run({...base,robot_filter:'included'});assert.equal(robots.status,1)
 const weak=await run({...base,product_visits:20,request_click_visits:10,request_started_visits:5,request_sent_visits:2});assert.equal(weak.status,1)
})
