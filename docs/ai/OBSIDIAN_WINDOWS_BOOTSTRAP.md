# Magic Metal — Windows Obsidian MCP Bootstrap

This is the machine-side bootstrap checklist. It does not contain secrets.

## 1. Preconditions

- Windows workstation with Obsidian installed.
- Target Magic Metal vault identified.
- Obsidian Local REST API plugin installed from Community Plugins and enabled.
- Cloudflare account/domain available for a named tunnel.

## 2. Verify Obsidian REST API locally

In Obsidian, open the Local REST API plugin settings and verify that its built-in MCP server is enabled.

Test the configured local endpoint from the workstation. Prefer HTTPS on port 27124.

The former sync tool has been restored from
`codex/obsidian-account-bridge-20260922` as `scripts/sync_obsidian.mjs`.
It creates the prepared catalogue note, verifies it by reading it back and
skips identical content on a repeat run. If the target note contains different
content, it stops without overwriting it. Choose a new `OBSIDIAN_SYNC_TARGET`
for a new revision.

Run from the project folder on the Windows computer with Obsidian, or in the
cloud after a working authenticated HTTPS gateway is available:

```powershell
node scripts/sync_obsidian.mjs
```

Supply `OBSIDIAN_API_KEY` securely through the local ignored `.env.local`
or the process environment. Never paste it into chat or commit it. Optional
non-secret settings:

```text
OBSIDIAN_API_URL=https://127.0.0.1:27124
OBSIDIAN_SYNC_SOURCE=docs/ai/OBSIDIAN_PENDING_RF_CATALOG_AND_CONNECTIONS_2026-10-14.md
OBSIDIAN_SYNC_TARGET=02 Projects/Magic Metal/OBSIDIAN_PENDING_RF_CATALOG_AND_CONNECTIONS_2026-10-14.md
```

HTTPS certificate verification stays enabled, including on localhost.
For the plugin's local certificate, export its certificate in the plugin
settings and set `NODE_EXTRA_CA_CERTS` to that PEM file before starting Node.
The script does not disable TLS checks. HTTP is accepted only on loopback.
From the cloud, `127.0.0.1` means the cloud machine, not your Windows PC.
The current cloud session has no working connection to the user's vault;
passing the local test suite does not prove a real Obsidian write.

Do not publish the plugin endpoint directly to the Internet.

## 3. Gateway requirements

The gateway should:

- bind only to localhost;
- proxy only approved Obsidian MCP operations;
- enforce vault path restrictions;
- reject destructive operations unless explicitly enabled;
- write an audit log;
- never log authorization headers or secret values.

## 4. Environment

Create a local `.env.local` file in the gateway directory. Never commit it.

Example variable names only:

```text
OBSIDIAN_MCP_URL=https://127.0.0.1:27124/mcp/
OBSIDIAN_API_KEY=<local Obsidian REST API key>
GATEWAY_BIND=127.0.0.1
GATEWAY_PORT=8787
```

The actual values must be entered locally; this document intentionally contains no secret.

## 5. Cloudflare

Install the current `cloudflared` binary using Cloudflare's official installation method.

For production use a named tunnel and run `cloudflared` as a Windows service. The tunnel origin should point to the local gateway, not directly to Obsidian.

Example topology:

```text
Internet
   ↓
Cloudflare Access / authentication
   ↓
Named Tunnel
   ↓
127.0.0.1:8787  (Magic Metal Gateway)
   ↓
127.0.0.1:27124  (Obsidian Local REST API/MCP)
```

## 6. Validation

Run these checks on the workstation:

- Obsidian is running.
- Local REST API responds.
- MCP handshake succeeds.
- Gateway responds locally.
- Gateway can read/search an allowed note.
- Gateway can create/append a test note in a dedicated test area.
- Gateway rejects a path outside the vault.
- Gateway rejects a destructive operation.
- Cloudflare tunnel reaches the gateway.
- Cloudflare Access blocks unauthenticated access.
- Audit log contains operation metadata but no secrets.

## 7. Rollback

If the tunnel or gateway behaves incorrectly:

1. Stop the `cloudflared` service.
2. Stop the gateway.
3. Obsidian remains usable locally.
4. Revert only gateway/tunnel configuration; do not alter the vault contents.

## 8. Completion record

After successful local setup, record only non-secret values in the project state:

- vault logical name
- gateway version
- tunnel logical name
- public hostname
- date/time verified
- enabled capabilities
- disabled/destructive capabilities

Never record API keys, passwords or tokens.
