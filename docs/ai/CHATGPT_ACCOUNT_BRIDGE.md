# ChatGPT account collaboration — project «Сайт»

## Roles

- Anthony Roberts: project Owner and master decision maker.
- Do Quoc An: Editor and task executor.

ChatGPT does not provide custom master/executor roles. The operational distinction is enforced by project instructions and the task handoff format.

## Native collaboration first

1. Sign in to the Anthony Roberts account.
2. Open the project `Сайт`.
3. Select `Share` → `Only those invited`.
4. Invite the Do Quoc An account with `Edit` access.
5. Accept the invitation in the Do Quoc An account.
6. Keep critical state in Obsidian because deleting the shared project removes access for everyone.

## Token-saving workflow

- One shared project holds the instructions and source files.
- Anthony creates a short task with expected output and acceptance criteria.
- Do Quoc An works in a separate branched chat.
- The executor returns only: result, evidence, risks and next action.
- Anthony records the accepted decision in the project state and Obsidian.
- Full chat histories are never copied between accounts.

## Optional local bridge

Run `scripts/start_chatgpt_account_bridge.ps1` on Windows. It starts two localhost-only Microsoft Playwright MCP servers with separate persistent profiles:

- Anthony Roberts: `http://127.0.0.1:8931/mcp`
- Do Quoc An: `http://127.0.0.1:8932/mcp`

Each profile requires a one-time manual ChatGPT sign-in. The profiles must not be reused for normal browsing or by another browser process.

The bridge is pinned to `@playwright/mcp@0.0.81`. Review upgrades before changing the version.

## Safety boundary

- Bind only to `127.0.0.1`.
- Allow only `https://chatgpt.com` network origin.
- Do not expose the MCP ports through a public tunnel.
- Do not store passwords, recovery codes, API keys or cookies in the repository.
- Require approval before sending messages, changing access or deleting content.
- Keep screenshots, recordings and generated code disabled by default.
