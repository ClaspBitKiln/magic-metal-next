import test from 'node:test'
import assert from 'node:assert/strict'
import { setup, GOALS, isTargetCounter } from './metrika-setup.mjs'

test('counter matching rejects lookalike hosts and deleted counters', () => {
  assert.equal(isTargetCounter({ site2: { site: 'https://www.magicmet.ru/' } }), true)
  assert.equal(isTargetCounter({ site: 'magicmet.ru.evil.example' }), false)
  assert.equal(isTargetCounter({ site: 'magicmet.ru', status: 'Deleted' }), false)
})
test('dry-run is GET only; apply creates once and repeated run is idempotent', async () => {
  let counter, goals = [], writes = 0
  const mock = async (url, init) => {
    assert.equal(new URL(url).origin, 'https://api-metrika.yandex.net')
    assert.equal(init.headers.Authorization, 'OAuth test-secret')
    let body
    if (init.method === 'POST') {
      writes++
      const payload = JSON.parse(init.body)
      if (payload.counter) { assert.equal(payload.counter.site2.site, 'magicmet.ru'); counter = { ...payload.counter, id: 123 }; body = { counter } }
      else { assert.equal(payload.goal.type, 'action'); assert.equal(payload.goal.conditions[0].type, 'exact'); const goal = { ...payload.goal, id: goals.length + 1 }; goals.push(goal); body = { goal } }
    } else if (new URL(url).pathname.endsWith('/goals')) body = { goals }
    else body = { counters: counter ? [counter] : [], rows: counter ? 1 : 0 }
    return { ok: true, json: async () => body }
  }
  const dry = await setup({ token: 'test-secret', fetchImpl: mock })
  assert.equal(dry.counterStatus, 'would-create'); assert.equal(writes, 0)
  const first = await setup({ token: 'test-secret', apply: true, fetchImpl: mock })
  assert.equal(first.counterId, 123); assert.equal(writes, GOALS.length + 1)
  const second = await setup({ token: 'test-secret', apply: true, fetchImpl: mock })
  assert.equal(writes, GOALS.length + 1); assert.equal(second.goals.every((goal) => goal.status === 'exists'), true)
})
test('missing token, ambiguous counters and conflicting goals cannot write', async () => {
  let calls = 0
  await assert.rejects(setup({ fetchImpl: async () => { calls++ } }))
  assert.equal(calls, 0)
  const response = (body) => ({ ok: true, json: async () => body })
  await assert.rejects(setup({ token: 'test', apply: true, fetchImpl: async (_url, init) => { assert.equal(init.method, 'GET'); return response({ counters: [{ id: 1, site: 'magicmet.ru' }, { id: 2, site: 'magicmet.ru' }] }) } }), /Multiple/)
  await assert.rejects(setup({ token: 'test', apply: true, fetchImpl: async (url, init) => { assert.equal(init.method, 'GET'); return response(String(url).includes('/goals') ? { goals: [{ name: 'request_sent', type: 'url' }] } : { counters: [{ id: 1, site: 'magicmet.ru' }] }) } }), /conflict/)
})
