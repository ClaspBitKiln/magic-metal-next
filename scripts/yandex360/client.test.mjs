import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { ENDPOINTS, Yandex360Client, redact } from './client.mjs';
import { main } from './cli.mjs';

const TOKEN = 'test-private-token-NOT-A-REAL-CREDENTIAL';
const json = (id, result) => new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
  headers: { 'content-type': 'application/json' },
});

test('real HTTP mock: initialize, OAuth, session, paginated discovery, SSE and one call', async t => {
  const seen = [];
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    seen.push({ headers: req.headers, body });
    res.setHeader('content-type', 'application/json');
    if (body.method === 'notifications/initialized') {
      res.writeHead(202).end();
      return;
    }
    let result;
    if (body.method === 'initialize') {
      result = { protocolVersion: '2025-03-26', capabilities: { tools: {} } };
      res.setHeader('Mcp-Session-Id', 'mock-session');
    } else if (body.method === 'tools/list') {
      result = body.params.cursor
        ? { tools: [{ name: 'mail.create_draft' }] }
        : { tools: [{ name: 'mail.list_folders' }], nextCursor: 'page2' };
    } else if (body.method === 'tools/call') {
      res.setHeader('content-type', 'text/event-stream');
      res.write(': ping\r\n\r\n');
      res.write('data: {"jsonrpc":"2.0","method":"notifications/progress","params":{}}\r\n\r\n');
      const event = `data: ${JSON.stringify({ jsonrpc: '2.0', id: body.id, result: { content: [{ type: 'text', text: 'folders' }] } })}\r\n\r\n`;
      res.write(event.slice(0, -1));
      setImmediate(() => res.end(event.slice(-1)));
      return;
    }
    res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const fetchImpl = (url, init) => {
    assert.equal(url, ENDPOINTS.mail);
    return fetch(`http://127.0.0.1:${server.address().port}/mcp`, init);
  };
  const client = new Yandex360Client({ service: 'mail', token: TOKEN, fetchImpl });
  await client.initialize();
  assert.deepEqual((await client.listTools()).map(x => x.name), ['mail.list_folders', 'mail.create_draft']);
  const response = await client.callTool('mail.list_folders', {});
  assert.equal(response.content[0].text, 'folders');
  assert.equal(seen[0].headers.authorization, `OAuth ${TOKEN}`);
  assert.equal(seen[1].body.method, 'notifications/initialized');
  assert.equal(seen[1].body.id, undefined);
  for (const request of seen.slice(1)) {
    assert.equal(request.headers['mcp-session-id'], 'mock-session');
    assert.equal(request.headers['mcp-protocol-version'], '2025-03-26');
    assert.equal(request.headers.authorization, `OAuth ${TOKEN}`);
  }
  assert.equal(seen.filter(x => x.body.method === 'tools/call').length, 1);
});

test('default denies mutations and foreign-service calls before network', async () => {
  let requests = 0;
  const client = new Yandex360Client({ service: 'mail', token: TOKEN, fetchImpl: () => { requests++; } });
  await assert.rejects(client.callTool('mail.create_draft', {}), /--write/);
  await assert.rejects(client.callTool('disk.get_item', {}), /selected service/);
  await assert.rejects(client.callTool('mail.list_folders', []), /object/);
  assert.equal(requests, 0);
});

test('explicit write only calls a tool advertised by the selected server', async () => {
  const calls = [];
  const client = new Yandex360Client({ service: 'mail', token: TOKEN, fetchImpl: async (_, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    if (body.method === 'tools/list') return json(body.id, { tools: [{ name: 'mail.create_draft' }] });
    return json(body.id, { content: [] });
  } });
  client.initialized = true;
  await assert.rejects(client.callTool('mail.nonexistent', {}, { write: true }), /not advertised/);
  await client.callTool('mail.create_draft', { subject: 'Draft' }, { write: true });
  assert.equal(calls.filter(x => x.method === 'tools/call').length, 1);
});

test('redacts token in success values, network errors and MCP errors', async () => {
  assert.equal(JSON.stringify(redact({ nested: [`echo ${TOKEN}`, 'Authorization: OAuth some-other-token'] }, TOKEN)).includes(TOKEN), false);
  for (const fetchImpl of [
    async () => { throw new Error(`Network echoed ${TOKEN}`); },
    async (_, init) => new Response(JSON.stringify({ jsonrpc: '2.0', id: JSON.parse(init.body).id, error: { code: -1, message: `OAuth ${TOKEN}` } }), { headers: { 'content-type': 'application/json' } }),
  ]) {
    const client = new Yandex360Client({ service: 'disk', token: TOKEN, fetchImpl });
    await assert.rejects(client.request('tools/list', {}), error => !error.message.includes(TOKEN) && error.message.includes('[REDACTED]'));
  }
});

test('HTTP failure is not retried and does not leak response body', async () => {
  let count = 0;
  const client = new Yandex360Client({ service: 'mail', token: TOKEN, fetchImpl: async () => {
    count++;
    return new Response(`private content ${TOKEN}`, { status: 503 });
  } });
  await assert.rejects(client.request('tools/call', {}), /^Error: MCP HTTP 503; request was not retried$/);
  assert.equal(count, 1);
});

test('validates JSON IDs and stops pagination loops', async () => {
  const wrong = new Yandex360Client({ service: 'mail', token: TOKEN, fetchImpl: async () => json(999, {}) });
  await assert.rejects(wrong.request('tools/list', {}), /ID mismatch/);
  const loop = new Yandex360Client({ service: 'disk', token: TOKEN, fetchImpl: async (_, init) => json(JSON.parse(init.body).id, { tools: [], nextCursor: 'loop' }) });
  loop.initialized = true;
  await assert.rejects(loop.listTools(), /repeated/);
});

test('failed tool outcome is not reported as success or retried', async () => {
  let calls = 0;
  const client = new Yandex360Client({ service: 'mail', token: TOKEN, fetchImpl: async (_, init) => {
    const body = JSON.parse(init.body);
    if (body.method === 'tools/list') return json(body.id, { tools: [{ name: 'mail.create_draft' }] });
    calls++;
    return json(body.id, { isError: true, content: [] });
  } });
  client.initialized = true;
  await assert.rejects(client.callTool('mail.create_draft', {}, { write: true }), /inspect service state/);
  assert.equal(calls, 1);
});

test('CLI missing credentials fails locally; token never accepted in arguments', async () => {
  await assert.rejects(main(['mail', 'tools'], {}), /OAuth token/);
  await assert.rejects(main(['mail', 'call'], {}), /--file/);
  await assert.rejects(main(['mail', 'tools', '--token', 'secret'], {}), /Unknown/);
  assert.match((await main(['--help'])).help, /drafts, not sending/);
});
