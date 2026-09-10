# Magic Metal — Obsidian ↔ AI Sync Architecture

## Status

DESIGN BASELINE — implementation-ready, local execution required for the final machine-side tunnel setup.

## Objective

Make the Obsidian vault the durable project knowledge base while keeping GitHub as the technical backup/source of truth for code and critical architecture documents.

## Approved architecture

```text
Obsidian Vault
    ↓
Obsidian Local REST API plugin
    ↓
Built-in MCP server (Streamable HTTP)
    ↓
Magic Metal controlled Gateway
    ↓
Cloudflare Tunnel
    ↓
Authenticated MCP access
    ↓
AI / ChatGPT
```

## Why this architecture

- The Obsidian Local REST API plugin already provides a built-in MCP server; a separate third-party Obsidian MCP server is unnecessary.
- The MCP endpoint is local and authenticated with the plugin API key.
- Cloudflare Tunnel provides an outbound-only bridge without opening an inbound port on the workstation.
- A gateway is retained as a security and policy boundary rather than exposing Obsidian directly.

## Local endpoints

Default plugin endpoints:

- HTTPS MCP: `https://127.0.0.1:27124/mcp/`
- HTTP MCP, if explicitly enabled: `http://127.0.0.1:27123/mcp/`

The actual enabled endpoint must be verified on the workstation before tunnel publication.

## Gateway policy

### Allowed by default

- vault search
- read note
- read section/block
- list relevant files
- create note
- append content
- surgical section/block update
- frontmatter update
- audit/log operations

### Blocked by default

- vault-wide deletion
- bulk deletion
- arbitrary shell/command execution
- destructive mass rename
- unreviewed overwrite of unrelated notes
- exposure of API keys, passwords or tokens

### Safety controls

1. Validate path is inside the configured vault.
2. Reject traversal (`..`) and absolute paths.
3. Keep an audit log of every write.
4. Create a backup/snapshot before destructive or high-impact changes.
5. Prefer append/section patch over full-file replacement.
6. Keep credentials only in local environment files; never commit them.

## Cloudflare Tunnel

Production approach:

- named Cloudflare Tunnel
- Windows `cloudflared` service
- private/local origin pointing to the gateway
- authentication/Access policy before exposing MCP

Development quick tunnels are not the production configuration.

## Credentials

The project uses the existing OpenAI credential decision already approved by the user. Credentials must remain local and must never be committed to GitHub or printed into logs.

Expected local secret storage:

```text
.env.local
```

Git protection must include `.env.local` in `.gitignore`.

## Machine-side bootstrap

The remaining machine-side actions are intentionally executed on the user's Windows workstation:

1. Confirm Obsidian installation and vault path.
2. Confirm Local REST API plugin is installed and enabled.
3. Confirm MCP endpoint and API key configuration.
4. Install/verify Node.js runtime for the gateway if required.
5. Install/verify `cloudflared`.
6. Configure named tunnel and hostname after Cloudflare authentication.
7. Start gateway as a local service/process.
8. Test read/search/write operations.
9. Verify logs and blocked destructive operations.
10. Record final endpoint/configuration in the project knowledge base without storing secrets.

## Important limitation

GitHub integration can create and maintain the implementation files, but it cannot silently install software or authenticate Cloudflare on the user's physical Windows workstation. The repository therefore contains the reproducible implementation and bootstrap configuration, while final workstation authentication remains a local operation.

## Project rule

Obsidian is the persistent project knowledge base. GitHub is the technical backup. Critical decisions, architecture, supplier registry, procurement rules and completed-stage handoffs must be represented in both where practical.
