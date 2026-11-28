/** Small Streamable HTTP MCP client. No credential files, retries or background jobs. */
export const ENDPOINTS = Object.freeze({
  mail: 'https://mcp.360.yandex.net/v1/mail/mcp',
  disk: 'https://mcp.360.yandex.net/v1/disk/mcp',
});

export const READ_TOOLS = new Set([
  'mail.list_folders', 'mail.list_labels', 'mail.search_messages',
  'mail.list_messages_in_folder', 'mail.list_messages_by_label',
  'mail.get_message', 'mail.read_message',
  'disk.search_items', 'disk.list_recent_items', 'disk.list_shared_disks',
  'disk.list_trash_items', 'disk.get_item', 'disk.get_download_url',
  'disk.get_public_item_permissions', 'disk.search_photos',
]);

export function redact(value, token) {
  const json = JSON.stringify(value, (_, v) => {
    if (typeof v !== 'string') return v;
    return (token ? v.split(token).join('[REDACTED]') : v)
      .replace(/OAuth\s+[^\s"'<>]+/gi, 'OAuth [REDACTED]');
  });
  return json === undefined ? undefined : JSON.parse(json);
}

async function parseReply(response, id) {
  if (!(response.headers.get('content-type') || '').includes('text/event-stream')) {
    const data = await response.json();
    if (data.id !== id) throw new Error('MCP response ID mismatch');
    return data;
  }
  if (!response.body) throw new Error('Empty MCP event stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let total = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      pending += decoder.decode(chunk.value, { stream: !chunk.done });
      total += chunk.value?.byteLength || 0;
      if (total > 8 * 1024 * 1024) throw new Error('MCP response exceeds 8 MiB');
      // Normalize after concatenation so CRLF split across chunks works too.
      pending = pending.replace(/\r\n/g, '\n');
      let boundary;
      while ((boundary = pending.indexOf('\n\n')) >= 0) {
        const event = pending.slice(0, boundary);
        pending = pending.slice(boundary + 2);
        const data = event.split('\n').filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).replace(/^ /, '')).join('\n');
        if (!data) continue;
        const message = JSON.parse(data);
        if (message.id === id) return message;
      }
      if (chunk.done) throw new Error('MCP stream ended before response');
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export class Yandex360Client {
  constructor({ service, token, fetchImpl = fetch, timeoutMs = 30_000 }) {
    if (!Object.hasOwn(ENDPOINTS, service)) throw new Error('Service must be mail or disk');
    if (typeof token !== 'string' || !token.trim() || /[\r\n]/.test(token)) {
      throw new Error('A valid OAuth token is required in the service environment variable');
    }
    this.service = service;
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.nextId = 0;
    this.sessionId = undefined;
    this.protocolVersion = undefined;
    this.initialized = false;
  }

  async request(method, params, { notification = false } = {}) {
    const id = notification ? undefined : ++this.nextId;
    const headers = {
      Authorization: `OAuth ${this.token}`,
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    if (this.protocolVersion) headers['MCP-Protocol-Version'] = this.protocolVersion;
    try {
      const response = await this.fetchImpl(ENDPOINTS[this.service], {
        method: 'POST', headers, redirect: 'error',
        body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, params }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        // Do not echo remote error bodies: they can contain mail content or credentials.
        throw new Error(`MCP HTTP ${response.status}; request was not retried`);
      }
      const session = response.headers.get('Mcp-Session-Id');
      if (session) this.sessionId = session;
      if (notification) {
        await response.body?.cancel();
        return;
      }
      const message = await parseReply(response, id);
      if (message.jsonrpc !== '2.0') throw new Error('Invalid MCP JSON-RPC response');
      if (message.error) {
        throw new Error(`MCP error ${message.error.code}: ${message.error.message}`);
      }
      if (!Object.hasOwn(message, 'result')) throw new Error('MCP response is missing result');
      return message.result;
    } catch (error) {
      throw new Error(redact(String(error?.message || error), this.token));
    }
  }

  async initialize() {
    const result = await this.request('initialize', {
      protocolVersion: '2025-03-26', capabilities: {},
      clientInfo: { name: 'magicmetal-yandex360-cli', version: '1.0.0' },
    });
    if (!['2024-11-05', '2025-03-26', '2025-06-18', '2025-11-25'].includes(result.protocolVersion)) {
      throw new Error('Unsupported MCP protocol version returned by server');
    }
    this.protocolVersion = result.protocolVersion;
    await this.request('notifications/initialized', {}, { notification: true });
    this.initialized = true;
    return result;
  }

  async listTools() {
    if (!this.initialized) throw new Error('Initialize the MCP connection first');
    const tools = [];
    let cursor;
    const seen = new Set();
    do {
      const result = await this.request('tools/list', cursor ? { cursor } : {});
      if (!Array.isArray(result.tools)) throw new Error('MCP tools/list returned no tool array');
      tools.push(...result.tools);
      cursor = result.nextCursor;
      if (cursor && seen.has(cursor)) throw new Error('MCP tools/list repeated a pagination cursor');
      if (cursor) seen.add(cursor);
      if (seen.size > 100) throw new Error('MCP tools/list exceeded pagination limit');
    } while (cursor);
    return tools;
  }

  async callTool(name, args, { write = false } = {}) {
    if (!name?.startsWith(`${this.service}.`)) throw new Error('Tool does not belong to selected service');
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Tool arguments must be an object');
    if (!READ_TOOLS.has(name) && !write) throw new Error('Mutation or unknown tool requires explicit --write');
    const tools = await this.listTools();
    if (!tools.some(tool => tool.name === name)) throw new Error('Tool is not advertised by this MCP server');
    // Exactly one call. Unknown/timeout outcome requires readback, never automatic retry.
    const result = await this.request('tools/call', { name, arguments: args });
    if (result.isError) throw new Error('MCP tool reported failure; inspect service state before retrying');
    return result;
  }
}
