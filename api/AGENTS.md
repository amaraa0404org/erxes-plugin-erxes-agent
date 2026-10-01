# `erxes-agent_api` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/erxes-agent_api`
- **Last synchronized:** `2026-09-21`

## Scope

### Owns

- The `erxes-agent` federated GraphQL and tRPC plugin service, started on
  port `3306`.
- The `agents` module under `src/modules/agents`: the per-user BYOK
  multi-provider `AgentsConnection` model, its GraphQL schema and
  resolvers, the server-side per-provider models listing, the thread
  list/detail GraphQL queries, the `agentsThreadRemove` mutation, the
  `agentsThreadsChanged` subscription surface, the tenant-wide
  `AgentsSettings` model with its `agentsSettings` /
  `agentsSettingsUpdate` GraphQL surface and the code-mode sandbox tool
  (`src/modules/agents/codeMode.ts`), and the declarative
  permission config at `src/meta/permissions.ts`.
- Chat attachment binding: the composer uses the platform `/upload-file`
  endpoint. `POST /agents/chat` accepts standard `{name,url,type,size}`
  metadata, reads tenant storage keys for supported text, and supplies raster
  image bytes through the guarded attachment reader. There is no plugin file registry or `/agents/files` route.
- The `cfos` module under `src/modules/cfos` (merged from the legacy
  plugin's lineage): the `CfOsConnectCodes` model (hashed, single-use,
  short-lived connect codes on collection `cf_os_connect_codes`) and the
  `POST /cf-os/connect-code` (dashboard-authenticated mint) and
  `POST /cf-os/exchange` (gatekeeper-only, `x-cf-os-secret` header)
  routes that back the cf_os_ui plugin's passwordless Cloudflare OS
  sign-in.

### Does not own

- Core/platform AI agent definitions or other plugins' tool implementations.
  This plugin revives the legacy `erxes-agent` name but reuses no code,
  models, or contracts from the previously removed plugin of the same name.
- Core API, gateway, shared libraries, frontend plugin code, or other plugins.
- The `erxes-agent_ui` surfaces; those live in the frontend project.
- Direct source imports from another plugin; cross-service access must use
  published GraphQL, tRPC, HTTP, event, or federation contracts.
- Other plugins' GraphQL operations and unannotated tRPC. The model has no
  GraphQL (or raw `/trpc` / Mongo) fallback; workspace data is reachable
  only through admit-only agent tools on the owning service.

## Current Capabilities

- Chat reads complete UTF-8 CSV, TXT, Markdown and JSON contents from
  tenant storage keys returned by the platform uploader. Text is limited to
  64 KiB per file and 128 KiB per turn. The `readFile` tool reads an
  attachment by url from any upload source: HTTP(S) CDN/public URLs are
  fetched; storage keys use the shared stream helper. `file://`, credentials,
  traversal, and private-network targets are refused. PNG, JPEG, GIF and WebP
  attachments are read on send and supplied directly as native image file parts;
  both chat and `readFile` supply base64 bytes, never provider-fetched URLs.
  Cloudflare Images storage keys use the tenant's CDN-aware platform reader
  when the streaming object-store read fails; they must not be treated as R2
  objects only. Images are limited to 2 MiB each, checked against actual bytes. Read failures
  stop chat before streaming with a readable error instead of metadata-only input. Filenames and contents are untrusted
  data, not instructions or authorization for tools.
- Boots as a federated plugin through `startPlugin` with name
  `erxes-agent` on port `3306`, wiring Apollo, tRPC, and per-`subdomain`
  model generation.
- Stores each user's bring-your-own-key (BYOK) agents connections — an
  entry per configured provider (`provider`, `model`,
  `config: { apiKey }`) in one document per user per tenant through the
  tenant-scoped `AgentsConnection` model, so several providers can be
  configured side by side. Entries reuse the platform's
  `IAiAgentConnection` shape verbatim so `providers.ts` consumes them
  unchanged. An entry's stored `model` defaults to the provider default
  (`getProviderDefaultModel` in `providers.ts`; re-saving without an
  explicit `model` refreshes a stale stored entry to the current default)
  and may be overridden by
  the chat request per turn (never persisted); documents written by the
  previous single-connection shape are lazily normalized on read.
- Serves GraphQL query `agentsConnections` (one masked entry per
  configured provider) and mutations
  `agentsConnectionUpsert(provider, model?, apiKey?)` /
  `agentsConnectionRemove(provider)`, all gated by `agentsChat` and scoped
  to the acting user's own document. The API key never appears in any
  response: reads expose only `hasKey`; an omitted `apiKey` keeps that
  provider's stored key, an empty string clears it, and a resulting entry
  without a key is rejected. Each provider's entry is independent — adding
  a provider never touches another one's key.
- Opencode-style BYOK setup per provider: select provider, paste API key,
  save. A stored entry's model defaults to the provider default
  (`PROVIDER_DEFAULTS`: openai → `gpt-5.6-luna`, grok → `grok-4.5`, kimi →
  `kimi-k3`, kimi-code → `kimi-for-coding`). The BYOK surface accepts
  exactly the four whitelist providers `openai`, `grok`, `kimi`,
  `kimi-code` (`BYOK_PROVIDERS` in `src/modules/agents/providerModels.ts`);
  `cloudflare-ai-gateway` is not accepted (it cannot build a URL without
  accountId/gatewayId the BYOK UI never collects) but `providers.ts` still
  resolves stored cloudflare connections.
- Serves GraphQL query `agentsModels` for the chat's model picker: for every
  configured provider it fetches the provider's public /models endpoint
  server-side with the stored key (`fetchProviderModels` in
  `src/modules/agents/providerModels.ts`; dual `Authorization: Bearer` +
  `x-api-key` headers, 10s timeout, deduplicated sorted ids). A provider
  whose listing fails is left out of the result instead of failing the
  query, and the key never leaves the server.
- Publishes declarative permissions through `startPlugin` meta: one `agents`
  module scoped to `all` with actions `showAgents` (`always`),
  `agentsChat`, and `manageAgentsSettings` (admin-only), and default
  groups `erxes-agent:admin` (all three actions) and `erxes-agent:user`
  (`showAgents` + `agentsChat`).
- Serves the tenant-wide settings surface: GraphQL query `agentsSettings`
  (gated `showAgents`) returns the tenant's flags and mutation
  `agentsSettingsUpdate` (gated `manageAgentsSettings`) patches them.
  Today the flags are `codeModeEnabled` (default `false`) and
  `codeModeEnvironment` (enum `in-process`, default `in-process`).
- Code mode: when the tenant flag is on, the chat agent additionally
  carries the `execute_typescript` tool built by Mastra's `createCodeMode`
  with the `QuickJsCodeModeTransport` (`@mastra/quickjs`) — model-authored
  TypeScript runs in an in-process QuickJS (WebAssembly) sandbox with a
  bare global object (no filesystem, network, process, timer, or module
  access). The allow-list injected into the sandbox is
  `{ searchTools, callTool: safeCallTool }` where `safeCallTool` is a
  wrapped clone of the bridge's `callTool` that refuses approval-gated
  tool ids with a readable `APPROVAL_REQUIRED` failure — sandboxed
  programs bypass Mastra's `requireApproval` suspension, so the wrapper is
  the gate. `askUser` is excluded. Wall-clock cap: 15s
  (`AGENTS_CODE_MODE_TIMEOUT_MS`); sandbox memory/stack use the transport
  defaults (128 MiB / 1 MiB). Only `POST /agents/chat` resolves the flag
  via `resolveCodeMode(models)` and snapshots it into the run's
  RequestContext; approve/answer resumes restore that original snapshot
  flag instead of re-resolving, so a resumed run keeps the tool set of
  the turn that suspended.
- One stable native DurableAgent per cached tenant runtime (not one agent
  per request). The base Agent's dynamic model callback re-fetches the
  acting user's current BYOK credentials server-side from the
  RequestContext snapshot (subdomain/userId/provider/model), so the same
  instance serves every request and durable resume without leaks.
  Resolutions without an identity (Mastra invokes the callback while
  wrapping/registering the agent, before any run exists) return an inert
  construction fallback — the native OpenAI default model with no
  credentials — instead of throwing, so runtime creation never fails on
  read paths such as the thread list. `createDurableAgent` wraps the base
  agent with `maxSteps: 32` and
  registers it in the tenant's Mastra instance, making the workflow
  persistent for suspend/resume across requests and restarts.
- Streams a Mastra-agent chat over SSE: `POST /agents/chat` accepts an
  optional client `runId` (valid UUID; generated otherwise), forwards only
  the newest client message, and delegates history to Mastra `Memory`. An
  `onSuspended` callback ends the HTTP response after already-published
  suspension chunks so the AI SDK becomes ready for approve/answer. Each turn carries an optional `provider` (validated
  against the user's stored entries; first configured provider when
  omitted), a per-turn `model` override (never persisted), and a
  `thinkingLevel` (`off`|`minimal`|`low`|`medium`|`high`, default `off`)
  mapped to per-provider options: openai `reasoningEffort`, grok/xai
  `reasoningEffort` ('minimal' → 'low'; kimi has no verified thinking
  control and is left untouched), kimi-code Anthropic
  `thinking: { type: 'enabled', budgetTokens }` with the output-token cap
  raised so the budget never starves the visible response.
  `@mastra/ai-sdk`/`ai` convert the Mastra stream to an AI SDK v7 UI stream;
  a failed model stream forwards the provider's readable error message to
  the client with no server-side console logging, not a generic dead end —
  `onError` also unwraps the plain serialized `{name, message, stack}`
  objects the adapter passes instead of real `Error` instances.
- Teaches the artifact fence convention in the fixed agent instructions
  (`DEFAULT_INSTRUCTIONS` in `src/modules/agents/agent.ts`): when the user
  needs a file they can preview/download/edit, the model emits ONE complete
  fenced code block per artifact — ```html (self-contained HTML),
  ```xlsx <title> (CSV rows, first row headers), ```docx/```pdf <title>
  (a markdown subset; never a ``` fence inside the content — 4-space
  indented code instead) — with the title on the fence line. Prompt-only
  convention; the UI renders matching fences inline. HTML instructions require
  responsive width, natural content height, concise CSS, and a complete document.
- Model calls allow up to 16,384 output tokens so artifact styles do not consume
  the entire response before the content. Kimi-code adds its selected thinking
  budget (1,000 / 4,000 / 10,000 / 16,000) on top, preserving 16,384 tokens
  for visible output. `buildAgentsModelSettings` sends `temperature: 0.2` for
  every provider except `kimi`, where the key is omitted entirely because
  Moonshot's kimi endpoint rejects any temperature but 1. The same model
  settings are snapshotted for durable resumes.
- Human-in-the-loop questions through the plugin-owned `ask_user` tool
  (`src/modules/agents/askUser.ts`, injected as `askUser` alongside the
  two-tier tool bridge; replaces Mastra's built-in single-question tool):
  the model batches one or more questions (each optionally with 2-4
  structured options and a `single_select`/`multi_select` mode) into ONE
  suspension, the tool calls `suspend({ questions })`, the run suspends
  durably in the same snapshot storage as approvals, and the suspension
  surfaces to the UI as a `data-tool-call-suspended` SSE part carrying the
  questions. `POST /agents/answer`
  (`{ threadId, answer, provider?, model?, thinkingLevel? }` → SSE)
  resumes the run via `agent.resumeStream(answer)` scoped to the newest
  suspended run's pending ask_user tool call (the shared kind-aware
  `findSuspendedToolCall`, so the model continues with the user's answers and
  an approval-gated newest suspension is rejected with 409 in favor of
  `/agents/approve`); the answer is persisted ONLY as the ask_user tool result inside
  the resumed assistant message — never as its own user message — and the
  UI renders it as the answered Q&A card (questions from the tool input,
  answers from the tool result, which is exactly what survives reloads).
  `answer` is a string (single
  free-text/single-select), a string array (one multi-select question), or
  one entry per question positionally (each a string or string array); the
  tool's resume schema accepts mixed positional text and string-array answers.
  It normalizes legacy named question-answer pairs, rejects incomplete/blank
  answers, and returns both readable content and structured positional
  `answers`, preserving custom details on reload.
  Ownership is re-checked before any resume, and a run suspended on an
  approval gate is rejected with 409 (it must go through `/agents/approve`).
- Agent instructions treat erxes as the current workspace: use conversation
  context and discover available tools before requesting data from the user;
  prefer essential questions and sensible reversible defaults. Reports default
  to the last complete calendar month and a complete self-contained HTML
  artifact unless specified. Report creation and revision requests imply HTML
  in every language; no format-selection question is needed. Explicit format
  requests override the default; questions about a report can remain prose.
  Compatible choices use multi-select; mutually exclusive ones use single-select.
  Custom answers are always available, so generated choices omit generic Other
  entries. Dynamic instructions include the current UTC date, label timezone
  assumptions, and never invent access to the user's page or selection.
- Every agent run entry point passes `maxSteps: AGENTS_MAX_STEPS` (32) —
  chat `stream`, answer `resumeStream`, and `approveToolCall` /
  `declineToolCall`. Mastra's default of 5 is exhausted silently by real
  turns (searchTools discovery + code-mode iterations + the ask_user step
  counting against the resumed run's budget), which ended runs right after
  their last tool result with no final answer and nothing surfaced.
- Threads and titles are handled entirely by Mastra: the agent auto-creates a
  missing thread during `stream`, and `generateTitle: true` derives a
  descriptive title from the first user message asynchronously (agent model,
  no response-time cost). No thread creation or title code is hand-written.
- Persists conversations in a dedicated `{db}_agents_memory` sub-database
  (derived from the shared mongoose connection — no env read) through a
  library `connectorHandler`, so agents memory never collides with the
  platform's own legacy `mastra_*` collections.
- Serves read-only GraphQL queries `agentsThreads(page, perPage)` (the
  acting user's threads, newest activity first, paginated) and
  `agentsThreadDetail(threadId)` (one thread's stored messages), both gated
  by `showAgents` and ownership-scoped to the acting user (cross-user access
  is rejected), plus mutation `agentsThreadRemove(threadId)` (gated by
  `agentsChat`, deletes associated stored files and registry rows before the
  acting user's thread via Mastra's `deleteThread`, then publishes
  `agentsThreadsChanged`; storage failure retains the thread for retry). Messages are stored
  in Mastra's v7 format (assistant text is
  a JSON-string envelope with `parts`). The `agentsThreadsChanged`
  subscription is published from Mastra's native `onFinish` and
  `memory.onTitleGenerated` hooks and from the removal mutation over the
  shared Redis pubsub, so the UI
  sidebar refreshes with no manual action.
- Exposes a two-tier tool bridge plus plugin-owned `askUser` and `readFile`.
  `searchTools(intent)` ranks descriptors from
  every plugin's `/agent-tools/manifest` (merged via service discovery, cached
  per subdomain for 60s), and `callTool(toolId, input)` executes one tool as the
  acting user via `/agent-tools/call`. Identity (`subdomain` + `userId`) is
  stamped from the gateway user header into RequestContext — never from the
  model, the chat body, or tool input. The owning service then checks that
  user's declared permission action before running the procedure. Asking the
  agent to bypass permissions cannot change identity or skip that check.
  `searchTools` is catalog-only (not permission-filtered); a user without
  `showDeals` can still *see* `sales.trpc.deal.find` in rankings, but
  `callTool` returns 403. Reviewed product tools get a plugin-owned
  nested `inputSchema` and description overlay (`toolContracts.ts`); unreviewed
  tools keep the platform manifest. `callTool` validates reviewed inputs before
  the HTTP call and returns `INVALID_TOOL_INPUT` (400) without echoing values.
  `callTool` declares a framework-native
  `requireApproval` predicate (true when `descriptor.destructive` or the
  plugin's always-confirm list, currently `inbox.conversations.changeStatus`),
  so Mastra itself suspends the gated call before `execute` ever runs;
  permission denials (403) and oversized responses (413) are returned to the
  model as readable tool results, not thrown.
- Durable human approval for destructive actions via the DurableAgent's
  native `approveToolCall`/`declineToolCall`: gated calls suspend into
  Mastra workflow snapshots in the same `{db}_agents_memory` sub-database,
  so approvals survive across HTTP requests and restarts. Resume routes use
  the runtime's stable durable agent and preserve the original run's
  RequestContext snapshot (provider/model/thinking/codeMode stay from the
  original run; body selection fields are accepted for compatibility but
  do not control rehydration). Both resume routes share one kind-aware
  discovery helper (`findSuspendedToolCall`): within the newest suspended
  run it selects the pending call matching the route's kind. Both resume
  routes pass `onSuspended` (same `!res.writableEnded` guard as chat) so a
  resumed run that suspends again on a chained gate closes the SSE and
  leaves the UI ready for the next approve/answer instead of hanging.
- Live stream events publish to one process-wide native Redis Streams bus
  (`RedisStreamsPubSub` from `@mastra/redis-streams`, key prefix
  `erxes-agent`, URL built from `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`)
  shared by every tenant `Mastra` runtime, so `observe` reconnects replay
  across API replicas and processes as well as browser refreshes. There is
  no `REDIS_URL` variable anywhere in the repo — the bus reuses the
  existing platform host/port/password contract (root `.env.sample`
  documents these variables alongside `MONGO_URL`). Per-run
  topics are deleted on terminal states through the native `clearTopic`
  path, with a bounded stream length (10k) and a 1-hour idle backstop TTL
  for streams that never reach cleanup. No custom adapter, cache, or run
  store exists.
- `POST /agents/chat/reconnect` observes an active run's stream for
  event replay after client disconnect — across API replicas and
  processes through the shared Redis Streams bus (retained entries replay
  what the client missed). Authenticates,
  requires a non-empty `threadId` and UUID-validates `runId`, verifies
  thread ownership, uses native
  `listActiveRuns({threadId, resourceId})` and only observes when that
  exact run is active (204 if not). Native `observe` replay is bounded by a
  60-second idle timeout for dead runs, re-armed by a native `isAlive`
  probe while the run is still executing or parked at an approval/ask_user
  gate, and its `onSuspended` callback closes the HTTP
  response so approval/answer remains usable. Chat validates `runId`,
  `threadId`, `provider`, and `model` types up front (400, never 500 on a
  wrong-typed value).

## Architecture

| Area        | Path                                        | Responsibility                                            |
| ----------- | ------------------------------------------- | --------------------------------------------------------- |
| Bootstrap   | `src/main.ts`                               | Starts the plugin on port `3306` and registers GraphQL/tRPC |
| Runtime     | `src/connectionResolvers.ts`                | Builds tenant-scoped models per `subdomain`               |
| Agents     | `src/modules/agents`                       | Provider resolution, Mastra agent builder (per-provider thinking options), Mastra memory (dedicated sub-db), per-user multi-provider BYOK model/GraphQL, HTTP routes in `src/routes.ts` |
| Models listing | `src/modules/agents/providerModels.ts` | BYOK provider whitelist + server-side /models fetching for the chat's model picker |
| Memory      | `src/modules/agents/memory.ts`             | Per-subdomain runtime bundle: Mastra `Memory` + minimal `Mastra` (`logger: false, workers: false`) sharing one `MongoDBStore`, plus one stable `DurableAgent` wrapping the base agent (registered in Mastra for persistent workflow snapshots); installs the MongoDB 4.4 workflow-snapshot codec |
| Mongo 4.4 compat | `src/modules/agents/mongo44Compatibility.ts` | Reversible base64 key-envelope codec + workflow-domain method wrappers so MongoDB 4.4 can store snapshots whose JSON-schema keys (`$ref`, `$schema`, dotted) it would misread as DBRefs; every touch point carries a `// MongoDB 4.4.25 compatible` marker |
| PubSub       | `src/modules/agents/pubsub.ts`             | Process-wide native `RedisStreamsPubSub` shared by every tenant runtime (cross-replica live replay) |
| RequestContext | `src/modules/agents/requestContext.ts`   | JSON-safe per-run selection snapshot (subdomain/userId/provider/model/thinkingLevel/codeModeEnabled); no secrets; durable agent's rehydration seam |
| ask_user    | `src/modules/agents/askUser.ts`            | Plugin-owned multi-question human-in-the-loop tool (batched `questions` suspension; normalizes legacy string/string[] and positional resume answers) |
| readFile    | `src/modules/agents/readFile.ts`           | Reads an uploaded attachment by url (HTTP fetch or storage key); blocks file://, traversal, and private networks |
| Tools       | `src/modules/agents/tools.ts`              | Two-tier Mastra tool bridge: `searchTools` (discovery + per-subdomain manifest cache) and `callTool` (execute as the acting user; framework-native `requireApproval` predicate suspends destructive/always-confirm actions before `execute`, which stays a pure runner) |
| Tool contracts | `src/modules/agents/toolContracts.ts`   | Plugin-owned agent contracts for reviewed core product tools; discovery overlay + pre-call validation; no source imports |
| Code mode   | `src/modules/agents/codeMode.ts`           | Builds the `execute_typescript` tool via Mastra `createCodeMode` + `QuickJsCodeModeTransport` (in-process WASM sandbox, 15s timeout); wraps `callTool` with the approval-gate refusal for the sandbox allow-list |
| Settings model | `src/modules/agents/db/definitions/settings.ts` + `db/models/Settings.ts` | Tenant-wide singleton on `agents_settings` (`codeModeEnabled`, `codeModeEnvironment`) with `getSettings`/`updateSettings` statics |
| Settings GraphQL | `src/modules/agents/graphql/schemas/settings.ts` + resolvers | `agentsSettings` query (`showAgents`) and `agentsSettingsUpdate` mutation (`manageAgentsSettings`) |
| Http        | `src/routes.ts`                             | `POST /agents/chat`, `POST /agents/approve`, `POST /agents/answer`, `POST /cf-os/connect-code`, `POST /cf-os/exchange` |
| Attachments | `src/modules/agents/fileBinding.ts`         | Validates upload metadata, reads tenant text and supplies server-read raster image parts |
| cf-os       | `src/modules/cfos`                          | Passwordless Cloudflare OS sign-in: connect-code mint + gatekeeper exchange (`CfOsConnectCodes` model) |
| Threads GraphQL | `src/modules/agents/graphql`           | Threads schema, read resolvers, and the `agentsThreadRemove` mutation resolver |
| Thread events | `src/modules/agents/threadsEvents.ts`  | Per-user `agentsThreadsChanged` publish over the shared Redis pubsub |
| Subscription bundle | `src/apollo/subscription.ts`      | Gateway graphql-ws bundle, `withFilter` per-user |
| Permissions | `src/meta/permissions.ts`                   | `IPermissionConfig` passed to `startPlugin` via `meta`    |
| GraphQL     | `src/apollo`, `src/modules/agents/graphql` | Type definitions, queries, and mutations                  |
| Models      | `src/modules/agents/db`                    | `agentsConnectionSchema` definition and `AgentsConnection` model class |
| Types       | `src/modules/agents/@types`                | `IAgentsConnectionEntry` and `IAgentsConnectionsDocument`   |
| tRPC        | `src/trpc`                                  | `appRouter` and outbound plugin clients                   |
| Container   | `Dockerfile`                                | Two-stage Alpine runtime image for the `docker-build` target; installs only the merged shared+plugin production deps, so every runtime import (e.g. `graphql-tag` for `src/apollo/typeDefs.ts`) must be a real dependency in `package.json` |

## Contracts

### Provides

- GraphQL query `agentsConnections` returning the acting user's masked
  entries (`provider`, `model`, `hasKey`, `updatedAt`; empty list when none
  is stored). The API key is never exposed.
- GraphQL mutations `agentsConnectionUpsert(provider, model?, apiKey?)`
  (adds/replaces ONE provider's entry, opencode-style: provider + key;
  provider must be one of the four `BYOK_PROVIDERS`; the stored model is
  ALWAYS the current provider default from `getProviderDefaultModel` unless
  an explicit `model` is provided — omitting `model` refreshes stale
  entries on re-save; omitted `apiKey` keeps that provider's stored key;
  empty string clears it; rejects a keyless result; config only ever
  carries `apiKey`) and `agentsConnectionRemove(provider)` (removes exactly
  that provider's entry; deletes the document when none remain).
- GraphQL query `agentsModels` returning
  `[AgentsProviderModels { provider models }]` — every configured
  provider's model ids, fetched server-side from the provider's /models
  endpoint with the stored key; a failing provider is omitted, and the
  result is empty (no fetch) when nothing is configured.
- Permission actions `showAgents` and `agentsChat`, the admin-only
  `manageAgentsSettings`, and default groups `erxes-agent:admin` /
  `erxes-agent:user`, declared through `startPlugin` meta permissions.
- GraphQL query `agentsSettings` returning the tenant's
  `AgentsSettings { codeModeEnabled codeModeEnvironment updatedAt }` and
  mutation `agentsSettingsUpdate(codeModeEnabled: Boolean,
  codeModeEnvironment: String)` (at least one field required;
  `codeModeEnvironment` validated against `AGENTS_CODE_MODE_ENVIRONMENTS`,
  currently `in-process`).
- tRPC namespace `erxesAgent` exposing a single `hello` query.
- No tRPC procedure is annotated with `.meta({ agent })`, so this plugin
  currently exposes no agent-callable tools of its own.
- Consumes other plugins' agent tools through the agents module's two-tier
  bridge (`src/modules/agents/tools.ts`): `searchTools` reads each service's
  `/agent-tools/manifest`; `callTool` posts to the owning service's
  `/agent-tools/call` with an HMAC header minted per acting user.
- HTTP routes on port `3306`: `POST /agents/chat` (SSE — accepts optional
  `runId` (valid UUID) and `provider`/`model`/`thinkingLevel`; stamps the
  exact non-secret selection into RequestContext for durable resume;
  `onSuspended` ends the response after published suspension chunks),
  `POST /agents/approve`
  (`{ threadId, approved, reason?, provider?, model?, thinkingLevel? }` →
  SSE; uses the runtime's stable DurableAgent; body selection fields are
  accepted but do not control rehydration),
  `POST /agents/answer`
  (`{ threadId, answer, provider?, model?, thinkingLevel? }` → SSE;
  same durable agent path),
  `POST /agents/chat/reconnect`
  (`{ threadId, runId }` → SSE or 204; observes an active run's stream
  for event replay across replicas via Redis Streams). Chat/approve/answer/reconnect require the gateway `user` header.
  `POST /agents/chat` accepts up to five platform attachments in
  `data-agents-files` as `{name,url,type,size}`. Native `file`/`image` parts
  and leftover `fileIds` return 400. Supported text is read from tenant
  storage keys on send. Raster images are read on send through the guarded
  `readFile` reader (tenant storage keys or public HTTP/CDN URLs) and emitted as
  server-owned data-URL file parts. Other HTTP/CDN attachments use `readFile`.
  Server-owned `textFileUrls` and `displayText` accompany the public metadata.
- GraphQL query `agentsThreads(page, perPage)` returning
  `AgentsThreadList { threads { id title createdAt updatedAt } total page
  perPage hasMore }` (1-based `page`), and GraphQL query
  `agentsThreadDetail(threadId)` returning `{ thread, messages }` —
  `NOT_FOUND` for a missing thread and `FORBIDDEN` "Thread belongs to another
  user." for a foreign thread. Both are gated by `showAgents` and
  ownership-scoped to the acting user.
- GraphQL mutation `agentsThreadRemove(threadId)` returning `Boolean` —
  `NOT_FOUND` for a missing thread and `FORBIDDEN` "Thread belongs to another
  user." for a foreign thread. Gated by `agentsChat` and ownership-scoped to
  the acting user. Publishes `agentsThreadsChanged` on success. Stored blobs
  follow the platform file lifecycle; the plugin does not delete them.
- GraphQL subscription `agentsThreadsChanged { userId }`, delivered through
  the gateway's graphql-ws subscription server from this plugin's
  subscription bundle (`src/apollo/subscription.ts`).

### Consumes

- Value bindings of `erxes-api-shared/utils` via direct static named imports
  (the plugin compiles as CommonJS, so `require` consumes them natively):
  `startPlugin`, `apolloCommonTypes`, `apolloCustomScalars`,
  `createGenerateModels`, `getPlugin`,
  `getPluginAddress`, `getPlugins`, `isEnabled`, `extractUserFromHeader`,
  `getSubdomain`, `encodeAgentToolsAuthHeader`, `agentToolsAuthHeaderName`,
  `ExpectedError`, `graphqlPubsub` (transient per-user PUBLISH on the
  `agentsThreadsChanged` channel), `sanitizeKey`, and
  `readFileStreamFromStorage` and `readFileFromStorage` (CDN-aware image fallback).
- `checkPermissionGroup` from `erxes-api-shared/core-modules` when a chat
  turn includes attachments (`agentsChat`).
- Types via `import type`: `ITRPCContext` (`erxes-api-shared/utils`),
  `IMainContext` and `IPermissionConfig` (`erxes-api-shared/core-types`), and
  `IAiAgent*` (`erxes-api-shared/core-modules`). Type-only imports of ESM-only packages
  (`ai`, `@mastra/core/llm`, `@mastra/core/agent`, `@mastra/core/memory`,
  `@mastra/mongodb`) carry a
  `'resolution-mode': 'import'` attribute, as nodenext requires from CommonJS
  files.
- The ESM-only AI runtime packages are loaded exclusively through standard
  dynamic `await import(...)`: `@mastra/core/agent` and `@mastra/ai-sdk`
  (in the agent builder/routes), `ai` (route streaming), `@mastra/memory`
  and `@mastra/mongodb` (agents memory), `@mastra/core/tools` (the two-tier
  tool factory in `tools.ts`), `@mastra/core/request-context` (the acting-user
  `RequestContext` stamped in `src/routes.ts`), and
  `@ai-sdk/anthropic` (kimi-code provider models). `@mastra/redis-streams`
  provides the process-wide live-event bus built once in
  `src/modules/agents/pubsub.ts`.
- Other plugins' admit-only agent tools through `searchTools` / `callTool`.
  Tool ids are `{plugin}.trpc.{path}`. The live source of truth is each
  service's `/agent-tools/manifest`; the families below are the currently
  annotated set this bridge can execute. Owning services expose read-only
  procedures only — no annotated create, update, tag, notify, or
  status-change procedure remains in any manifest. Coverage gaps are filled by
  annotating more read-only tRPC procedures on the *owning* plugin, never by adding a
  GraphQL fallback here. The `destructive` plus always-confirm approval gate is
  retained as a defensive mechanism; no currently exposed tool requires approval.
  - **core** — customers `{find, findOne, findActiveCustomers, count}`
    (`contactsRead`); companies `{find, findOne,
    findActiveCompanies}` (`contactsRead`); products `{findOne, count}`
    (`productsRead`) and
    `products.rules.find` (`productsRead`; description talks about product
    search but the procedure loads product rules by `_id` — `products.find`
    itself is not annotated); productCategories `{find, findOne, withChilds,
    count}` (`productsRead`); productUoms `{find, findOne}` and
    `productConfigs.getConfig` (`productsRead`); fields `{find, findOne,
    getFieldList, fieldsCombinedByContentType, prepareCustomFieldsData}` and
    `fieldsGroups.find` (`propertiesRead`, `prepareCustomFieldsData` is declared
    as a mutation but performs a pure transformation and writes nothing); tags `{find, findOne,
    findWithChild}` (`tagsRead`); users `{find,
    findOne, getCount}` (`teamMembersRead`); branches / departments
    `{find, findOne, findWithChild}` and units `{find, findOne}`
    (`organizationRead`); brands `{find, findOne}`
    (`brandsRead`); segment `{findOne,
    fetchSegment, isInSegment}` (`segmentsRead`); documents `{find, findOne,
    print}` (`documentsRead`); `log.list` (`logsRead`); `import.getTemplate`
    (`importsManage`); approval `{state, states}` (`approvalLocksManage`);
    cpUsers `{list, get}`, `clientPortals.get`, cpNotifications `{list}`
    (`clientPortalRead`).
  - **sales** — deal `{findOne, find, count, getLink}` and stage `{findOne,
    find}` (`showDeals`); `pipeline.findOne` (`pipelinesWatch`); pos
    `{findOne, find}` (`posRead`); `pos.ordersDeliveryInfo` and orders
    `{findOne, find}` (`posOrderRead`). No deal create/edit/remove. `deal.find`
    is bounded (default 20, max 100).
  - **frontline** — `inbox.integrations.{find, findOne, count}` and
    `inbox.getIntegrationKinds` (`showIntegrations`); `inbox.conversations.{findOne,
    count}`, `inbox.getConversationsList`, `inbox.conversationMessages.{findOne,
    find}` (`showConversations`); `form.submissionsByConversation`
    (`showFormSubmissions`). No status-change or other write procedure is exposed.
  - **block** — project `{findOne, find}` (`showProjects`); unit `{findOne,
    find, count}` (`showUnits`). `find` is bounded like sales.
  - **oroltsoo** — `oroltsooProfile.get` (`showOroltsooProfiles`).
  - **not exposed** — this plugin (`erxesAgent.hello` has no agent meta);
    accounting, loyalty, payment, `agent_api`, and most other plugins. Sales
    `deal.aggregate` / `create` / `updateOne` / `removeItem` and similar
    internals stay invisible.

## Data and State

- Tenant-scoped Mongoose models are generated per request `subdomain` through
  `generateModels`.
- One Mongo model is registered: `AgentsConnection` on collection
  `agents_user_connections`, defined by `agentsConnectionSchema`
  (`userId` required/unique, `connections` array of
  `{ provider, model, config }` subdocuments, `timestamps: true`), holding
  one BYOK connections document per user per tenant with an entry per
  configured provider. Documents from the previous single-connection shape
  are lazily normalized on read and fully rewritten on the next write; no
  separate migration runs.
- A second Mongo model, `CfOsConnectCodes` on collection `cf_os_connect_codes`
  (hashed single-use cf-os sign-in codes with a TTL index on `expiresAt`),
  backs the `cfos` module's passwordless sign-in routes.
- A third Mongo model, `AgentsSettings` on collection `agents_settings`
  (tenant-wide singleton; `codeModeEnabled` + `codeModeEnvironment` with
  schema defaults, created on first read/write) backs the admin settings
  surface and the code-mode flag. This new write surface was explicitly
  requested and approved by the user when choosing tenant-wide admin
  control for code mode.
- Chat history retains supported text contents in the user message, alongside
  public attachment metadata (`name`, `url`, `type`, `size`), `contentsNotRead`,
  `textFileUrls` and original `displayText`. Server-read image bytes persist as
  native data-URL file parts for later turns; `contentsNotRead` is false when
  text or images were supplied. No plugin file collection, Redis keys or queues.
- Conversation state (threads, messages, indexes) and durable approval
  snapshots (`mastra_workflow_snapshot`) are owned entirely by Mastra
  `Memory`/`MongoDBStore` (store id `erxes-agent-store`) in the dedicated
  `{db}_agents_memory` database
  (derived from `mongoose.connection.db.databaseName`); no custom thread,
  message, or approval models exist. While the MongoDB 4.4.25 compatibility
  layer is installed, snapshot object keys that MongoDB 4.4 would misread as
  DBRefs (`$ref`, `$schema`, dotted keys) are stored base64-encoded inside a
  `__erxesMongo44Entries_v1` envelope; `snapshot.status`, `context`,
  `resourceId`, and timestamps stay plain and queryable, and every read path
  also decodes legacy unencoded snapshots.
- An in-process `Map<subdomain, Promise<IAgentsRuntime>>` caches one runtime
  bundle (`{ memory, mastra, agent }`) per subdomain so store initialization,
  base agent construction, and durable wrapping run at most once; failed
  creations are evicted so the next request retries. `getAgentsMemory`
  delegates to the bundle's `memory`. The `agent` is a `DurableAgent`
  wrapping the base agent with `maxSteps: 32`, registered in Mastra for
  persistent workflow snapshots.
- The `agentsThreadsChanged` subscription event is a transient Redis
  `PUBLISH` on one channel carrying only `{ userId }` — no new Redis keys,
  queues, or collections — and the thread list/detail queries are pure reads
  that add no models.
- No migrations exist yet.

## Local Invariants

- Chat send-time text extraction reads tenant storage keys only. Images use
  the guarded `readFile` reader and signature-sniffed MIME types, never the
  client-declared MIME as proof of image contents. Native client media remains
  forbidden; only server-read bytes may become model media. The UI must use
  server-saved `displayText`.
- `readFile` never opens `file://`, relative disks, or path traversal (`..`,
  backslashes, absolute keys). Client HTTP URL fetches require http(s), no credentials,
  public DNS results pinned to the request, and revalidation of every redirect.
  Neither direct image input nor image tool results may delegate URL fetching
  to the model provider. Image storage-key failures may fall back to the public
  platform `readFileFromStorage` API, which understands Cloudflare Images CDN
  configuration. This fallback buffers in the platform helper before enforcing
  the byte cap; it shares the original read deadline and never retries a size
  rejection or an expired deadline. Do not duplicate platform storage config or
  credentials in this plugin.
- Redis is disposable replay/coordination state; MongoDB owns durable snapshots. Stream writes, retry writes, and group creation must atomically attach an idle TTL (one hour in production). Never replace this with a separate write-then-expire sequence or a periodic key scan.
- Durable runs retain terminal replay for 30 seconds, then clear both agent and workflow stream topics. Lease writes use atomic TTLs and ownership-checked release. Failed deletes and crashed producers rely on expiry; no plugin Redis key may be created without bounded retention.
- Poison-event retries are capped at five. Adapter warnings log only the message, never metadata containing events or connection details. The isolated Redis integration check covers successful deletion, denied deletion, producer exit, empty subscription streams, retries, and abandoned/transferred leases.
- Normalize every model-facing tool with `makeToolInputSchemaMongoCompatible` before Agent construction; omit only the optional root `$schema` marker to retain MongoDB 4.4 snapshot compatibility without changing validation.
- MongoDB 4.4.25 compatible: while any deployment runs MongoDB 4.4,
  `memory.ts` must install `installMongo44WorkflowCompatibility` on the
  store's workflows domain before any run starts. The codec reversibly
  base64-encodes only object keys starting with `$`, containing `.`, or
  colliding with the envelope key; BSON values pass through untouched and
  inputs are never mutated. Removal path (after the cluster is past MongoDB
  5.0 and encoded suspended runs have drained): delete
  `mongo44Compatibility.ts`, its test, the install call in `memory.ts`, and
  every `// MongoDB 4.4.25 compatible` marker — `rg 'MongoDB 4.4.25
  compatible'` lists them all. Plain snapshots stay readable either way, so
  removal needs no data migration.
- Keep Zod 3.25+, `graphql-tag`, and `jsonwebtoken` as direct runtime dependencies for standalone deployment.
- Write ship-stable code: prefer framework-native APIs and existing platform
  contracts over custom mechanisms (for example, Mastra-native tool approval
  instead of hand-rolled suspend/resume).
- Never introduce a new write surface (Mongo collection, Redis key or queue,
  log pipeline) without discussing it with the user first.
- Preserve tenant isolation by resolving models from the request `subdomain` in
  every resolver, service, worker, and route.
- Define schemas with `new Schema(...)`; never introduce `schemaWrapper`.
- The tRPC router key must remain a valid JavaScript identifier
  (`erxesAgent`). The kebab-case plugin name `erxes-agent` is not a
  valid unquoted object key and produces a parse error.
- `startPlugin` must keep `corsOptions: { credentials: true, origin: true }`.
  The agents UI authenticates with the httpOnly `auth-token` cookie via
  `credentials: 'include'`; the plugin's proxied CORS headers win over the
  gateway's, and default `cors()` (`Access-Control-Allow-Origin: *`) makes
  browsers reject every credentialed response ("Failed to fetch").
- Resolvers take `(parent, args, context)`; read `models` from the third
  argument only. Reading it from the second silently yields `undefined`.
- Port `3306` must stay unique across `backend/plugins/*/src/main.ts`. The
  generator default `33010` is already used by `agent_api`, `blocktest_api`,
  and `insurance_api`.
- Agent tool annotations are admit-only: a procedure is invisible to agents
  unless it explicitly declares `.meta({ agent: { description, permission } })`.
- Tenant tool curation is intentionally **default-open**; there is deliberately
  no plugin-side allow/deny list, curation storage, or curation GraphQL
  setter. Tool exposure is already curated by the platform's admit-only tRPC
  annotation (only procedures declaring `.meta({ agent: { description,
  permission } })` reach `/agent-tools/manifest`), and execution is
  additionally enforced by the owning service's per-user permission check at
  `/agent-tools/call`. `searchTools` therefore returns every ranked manifest
  match and `callTool` routes any `toolId` present in the manifest. Reviewed
  contracts overlay description/`inputSchema` and validate input; they must not
  hide tools or skip the owning service. Do not build plugin-side curation
  unless it is explicitly re-requested.
- Plugin-owned tool contracts (`toolContracts.ts`) are written from a source
  review of the owning procedure, not from platform `z.any()` manifests or CSV
  aliases. They are a strict agent subset: unknown fields fail, required fields
  follow the owning model, and core still enforces uniqueness, masks, and
  existence. Do not import other plugins or core implementations. Extend a
  contract only after re-reading the current source. Unreviewed tool ids stay
  pass-through.
- Never add a GraphQL (or raw Mongo / `/trpc`) fallback tool for the model.
  The two Mastra tools stay `searchTools` and `callTool` (plus optional
  sandboxed `execute_typescript`, which wraps those). GraphQL
  `wrapPermission` is login-only; action checks and row/pipeline filters are
  opt-in per resolver and some queries skip them (sales `dealsTotalCount`,
  board/pipeline/stage query files, client-portal `wrapperConfig`). A GraphQL
  executor would undo admit-only curation, skip `requireApproval`, and blow
  the 64KB response cap. Missing coverage is fixed by annotating a bounded
  tRPC procedure on the owning plugin.
- Tool identity is never model-controlled. `callTool` reads `subdomain` /
  `userId` from the RequestContext stamped in `src/routes.ts` via
  `buildAgentsRequestContext` (gateway `user` header), mints
  `x-erxes-agent-auth` (HMAC, 5-minute TTL, `JWT_TOKEN_SECRET`, no default)
  for that user, and POSTs to the owning plugin's `/agent-tools/call`.
  Prompting the agent to bypass, act as admin, or call Mongo/GraphQL cannot
  change identity. Code mode uses the same `callTool` path after refusing
  gated ids.
- `/agent-tools/call` (platform, `erxes-api-shared`) is the permission gate:
  unknown tool → 404; no declared permission → 403; user missing → 403;
  `checkPermissionGroup(action)` failure → 403 `Permission required`.
  Owners (`isOwner`) pass `canGroup` like the rest of erxes. 403/413 are
  readable tool results, not thrown exceptions.
- That check is **action-only** (`showDeals`, `contactsRead`, …). It does
  not apply permission scope (`own` / `group` / `all`) or plugin UI filters
  such as sales `generateFilter` / `checkItemPermByUser`. A user without the
  action cannot read that data through the agent. A user who has the action
  may see more rows than the matching GraphQL list. Do not "fix" that here
  by opening GraphQL; owning plugins should bound and filter their annotated
  procedures.
- HTTP `POST /agents/chat`, `/agents/approve`, `/agents/answer`, and
  `/agents/chat/reconnect` require a logged-in user (gateway user header).
  Chat additionally checks `agentsChat` when attachments are supplied.
  Text-only chat and resume/reconnect do not themselves check that action.
  GraphQL BYOK/threads check `agentsChat` / `showAgents`. Tool execution still
  enforces the tool's declared action.
- Plugin authors expose tools one procedure at a time with
  `.meta({ agent: { description, permission } })` (local `agentMeta()` helper)
  using a permission action that plugin actually registers. Do not annotate
  internals, unbounded finds, or system-user helpers.
- Anthropic-protocol providers (`kimi-code`) need URL and header normalization
  that differs from the platform bridge. `@ai-sdk/anthropic` requests
  `${baseURL}/messages` and only auto-appends `/v1` when `baseURL` is exactly
  `https://api.anthropic.com`, whereas the platform bridge requests
  `${baseUrl}/v1/messages`. The stored connection `baseUrl` is therefore
  pre-normalized to end with `/v1` so both clients hit the same endpoint;
  without it the provider returns HTTP 404 `resource_not_found_error`. The
  platform also authenticates with **both** `Authorization: Bearer` and
  `x-api-key`, so the plugin sends both; connection-level headers win on
  conflict. Never pass `authToken` alongside `apiKey` — `createAnthropic`
  throws.
- OpenAI on its default endpoint must be built WITHOUT a `url` in the Mastra
  model config (`createModelConfig` in `src/modules/agents/providers.ts`):
  a `url` forces Mastra's generic openai-compatible Chat Completions client,
  which maps `maxOutputTokens` to `max_tokens` — a parameter OpenAI's
  reasoning models (the gpt-5 family, e.g. `gpt-5.6-luna`) reject with a
  400 — and it cannot express `max_completion_tokens`. Without `url`,
  Mastra resolves `openai/*` through its native OpenAI Responses client,
  which maps model settings correctly for reasoning models. Only a
  connection that explicitly overrides the OpenAI endpoint (proxy) keeps
  the openai-compatible path. Do not "simplify" this by re-adding the
  default url.
- A failed model stream must surface its real cause: `pipeModelOutput`'s
  `onError` forwards the provider's readable message to the client with no
  server-side console logging. The `@mastra/ai-sdk` adapter may pass a
  plain serialized `{name, message, stack}` object rather than an `Error`,
  so `describeStreamError` unwraps both shapes. Provider error bodies
  contain no secrets (the API key never appears in one). Do not replace
  this with a generic message — it makes every provider failure
  undiagnosable.
- The API gateway proxies Server-Sent Events **without buffering** (verified:
  1s-spaced chunks arrive 1s apart through `/pl:erxes-agent/...` with
  roughly 9ms added latency). SSE is therefore a safe transport here even
  though no other backend service uses it. Do not add response compression or
  `selfHandleResponse` to that proxy path, and never wrap a streaming route in
  `apiHandlers` — that wrapper awaits completion via `logHandler`.
- The plugin compiles as CommonJS under `"module": "nodenext"` /
  `"moduleResolution": "nodenext"` with no `"type": "module"` field in
  `package.json`. ESM-only AI packages (`ai`, `@mastra/core/*`,
  `@mastra/ai-sdk`, `@ai-sdk/anthropic`) must never be statically imported as
  values; load them with `await import(...)` at the point of use. With plain
  `"module": "commonjs"`, TypeScript downlevels `import()` into `require()`,
  which cannot load ESM-only packages — do not narrow the module setting.
- There is no local CJS/ESM interop shim: no namespace-unwrap helper,
  synthetic-default guard, `createRequire`, or hand-written `require()` exists
  for `erxes-api-shared`. Restore direct named imports instead.
- No environment variables: provider credentials/secrets are never read from
  env or `.env`. They live only on the per-user BYOK connection document
  written by `agentsConnectionUpsert`; `src/modules/agents/providers.ts`
  resolves config-only values, with public endpoint/model constants as the
  sole non-secret fallbacks. Never reintroduce `getEnv`/`process.env` here,
  and never echo secret values into errors, logs, or GraphQL responses
  (reads expose only `hasKey`). Infrastructure connection settings
  (`REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` for the shared stream bus)
  follow the platform Redis convention and are not provider credentials.
- BYOK storage is multi-provider: one document per user, one entry per
  provider in its `connections` array — keep every read/write operating on
  the array (never restore a single top-level `connection` field; the lazy
  normalizer exists only to absorb legacy documents). The BYOK whitelist is
  `BYOK_PROVIDERS` in `src/modules/agents/providerModels.ts` — exactly
  `openai`, `grok`, `kimi`, `kimi-code`; it is the single source for the
  upsert mutation's provider validation. The API key never leaves the
  server and must never appear in an error message. The BYOK surface
  carries no `baseUrl`; `providers.ts` still resolves `config.baseUrl` and
  `cloudflare-ai-gateway` for stored/agent connections only.
- Model listing (`agentsModels`) is a server-side read: fetch
  `PROVIDER_MODELS_ENDPOINTS` with the stored key, dedupe + sort ids, and
  swallow per-provider failures so one bad key never breaks the picker;
  never expose keys, raw provider errors, or endpoints that were not
  fetched for a configured provider.
- The stored model must always track the current provider default: the
  upsert resolves a missing `model` to `getProviderDefaultModel(provider)`
  — NEVER to the previously stored model — so re-saving (key rotation)
  refreshes entries whose model predates a default change, and the UI can
  display the stored model truthfully. An explicit `model` argument still
  overrides, and the chat's per-turn override is never persisted. The
  `PROVIDER_DEFAULTS` map in `providers.ts` is the single backend source;
  the frontend's `PROVIDER_OPTIONS.defaultModel` display copy must be kept
  in sync with it.
- Thinking levels are a fixed normalized enum
  (`off|minimal|low|medium|high`, default `off`) mapped in
  `agent.ts` to per-provider `providerOptions` (openai `reasoningEffort`;
  xai/grok `reasoningEffort` with 'minimal' → 'low'; kimi untouched — no
  verified control; kimi-code Anthropic `thinking.budgetTokens` is added to
  the 16,384-token visible-output allowance when thinking is on). Do not pass raw thinking values to providers.
- Code mode is security-sensitive. The sandbox allow-list must stay
  `{ searchTools, callTool: safeCallTool }` and must NEVER include
  `askUser` (suspending from inside a sandboxed program has unverified
  semantics). `safeCallTool` must keep refusing gated tool ids
  (`isGatedAgentToolCall`: manifest-destructive or always-confirm) —
  Mastra's code-mode dispatcher invokes `tool.execute` directly, so
  `requireApproval` never runs for `external_*` calls and the wrapper is
  the only gate. The wrapper fails closed when the request context is
  missing. Keep the wall-clock cap (`AGENTS_CODE_MODE_TIMEOUT_MS = 15000`)
  and the QuickJS transport's default memory/stack bounds; the QuickJS WASM
  boundary is what denies filesystem/network/process access to guest code —
  never pass host capabilities beyond the allow-listed tools.
- `agentsSettingsUpdate` stays gated by the admin-only
  `manageAgentsSettings` action (granted only to the `erxes-agent:admin`
  default group). The `agentsSettings` read stays gated by `showAgents`
  because the flag shapes every user's chat. New environments must extend
  `AGENTS_CODE_MODE_ENVIRONMENTS` (single source shared by the schema enum
  and resolver validation).
- The code-mode tool is built once per process
  (`buildCodeModeAddition` memoizes) wrapping the process-wide bridge
  tools; the tenant flag is resolved per request by the routes
  (`resolveCodeMode(models)`) and passed into `buildAgentsAgent`, so
  chat/approve/answer all keep (or lose) the tool together.
- In jest, `ts-blank-space` is mapped to a callable CJS stub
  (`src/modules/agents/__tests__/__stubs__/ts-blank-space.js`):
  `@mastra/quickjs@0.1.0`'s CJS bundle misuses esbuild's `__toESM(mod, 1)`
  against the real ESM-only package (`.default` is the namespace, not the
  function), and loading its ESM entry drags in real-ESM loading plus the
  WASM loader's dynamic imports. Test programs are plain JS, so identity
  passthrough is equivalent; production uses the real ESM package. The
  jest run needs `NODE_OPTIONS=--experimental-vm-modules` for the
  `@jitl/quickjs-wasmfile-release-sync` variant's dynamic import.
- Agents memory must stay in the dedicated `{db}_agents_memory` sub-database
  resolved via `mongoose.connection.useDb(...)` — never the shared
  `mastra_threads`/`mastra_messages` collections in the base DB. Those hold
  legacy-format rows (old `threadId`/`agentId`/`userId` schema, no `id`
  field) from an earlier platform Mastra integration; the current store's
  required unique index on `{id}` cannot be created over them. The store's
  `connectorHandler` reuses the single mongoose client (no second pool, no
  env) and keeps `close()` a no-op because the platform owns the connection
  lifecycle.
- Chat forwards only the newest client message with an explicit
  `memory: { thread, resource }` option. Sending the full transcript would
  duplicate stored messages and risk ordering conflicts with stored
  timestamps. Mastra auto-creates missing threads and derives their titles,
  so the plugin never pre-creates or titles them itself. The resulting
  thread id is returned via the `X-Agents-Thread-Id` header; the resource is
  the acting user id, and any cross-user thread access must 403 — this
  ownership check is the only thread-handling logic kept server-side.
- Thread reads must stay read-only and ownership-scoped: `agentsThreads`
  filters by the acting user id, and `agentsThreadDetail` throws for foreign
  threads, masking their existence. `agentsThreadRemove` follows the same
  ownership pattern (`getThreadById` → `NOT_FOUND` → `FORBIDDEN`) before
  calling Mastra's `deleteThread`, and never deletes a foreign thread.
- Publishes to `agentsThreadsChanged` must stay transient per-user events
  carrying only `{ userId }`, fired from Mastra's native
  `onFinish`/`onTitleGenerated` hooks and from `agentsThreadRemove` after a
  successful deletion — never add other manual publish points or
  new Redis state.
- `src/apollo/subscription.ts` must contain NO TypeScript-only syntax (no
  interfaces, no type annotations, no casts): the gateway downloads it from
  `/subscriptionPlugin.js`, saves it with a `.js` extension, and parses it as
  JavaScript, so TS syntax crashes the gateway with TS8006/TS8010. Keep it in
  block_api's plain-JavaScript bundle style.
- Approval uses Mastra's native tool-approval API, not a hand-rolled
  suspend/resume: `callTool` declares a `requireApproval` predicate that reads
  the acting user's `subdomain` off the approval context plus the call's
  `toolId`, and gates on `descriptor.destructive` or the always-confirm list,
  so Mastra suspends the gated call before `execute` runs and the executor
  stays a pure runner. Note the two request-context shapes: inside
  `requireApproval` the `ctx.requestContext` is a **plain record** (read with
  property access, `ctx.requestContext.subdomain`), whereas inside `execute`
  the `context.requestContext` is a `RequestContext` instance (read with
  `.get('subdomain')`) — do not mix the two access patterns. The approve route
  accepts only `threadId`/`approved`/`reason`, re-checks thread
  ownership before any resume, and discovers the run through
  `agent.listSuspendedRuns({ threadId, resourceId })` (newest first) rather
  than trusting a client-supplied run id; it then calls
  `agent.approveToolCall({ runId, toolCallId })` or
  `agent.declineToolCall({ runId, toolCallId, reason })`. Scoping is by
  Mastra's per-call `toolCallId`, so approving one held call never
  auto-approves another and a decline never executes. Approval gating and
  execution both derive from the same per-subdomain manifest, and the owning
  service independently enforces the admit-only permission check, so a tool
  missing from the manifest cannot be executed destructively either. The
  always-confirm list exists because some platform mutations are declared as
  queries and would otherwise escape the `destructive` flag — keep it in sync
  with the platform's agent-tool annotations. Both resume routes share one
  kind-aware discovery helper (`findSuspendedToolCall` in `src/routes.ts`):
  it takes the newest suspended run and selects that run's pending call of
  the requested kind — `requiresApproval === true` for `/agents/approve`,
  `false` for `/agents/answer` — so a snapshot holding parallel mixed calls
  (a destructive call and an ask_user call) resolves to the call its route
  actually decides, and a newest suspension of the other kind 409s pointing
  at the sibling route instead of being decided wrongly. Newest-run-first
  resolution is deliberate: a thread's suspensions must be resolved in order
  so the transcript stays chronological; the routes never skip to an older
  run. A degenerate snapshot with no reported tool calls keeps the
  historical unscoped resume (no `toolCallId`), letting Mastra resolve the
  run's pending call from its own snapshot. The runtime `Mastra` is built
  with `workers: false`; native `requireApproval` suspend,
  `approveToolCall`/`declineToolCall` resume, chained-call re-suspension, and
  parallel read+destructive steps were all verified against real Mastra with a
  mock LLM without workers, so do not enable workers (and their scheduler
  machinery) without re-verifying the need. The Redis Streams bus needs no
  worker either: `stream`/`resume`/`observe` drive the workflow in-process
  via `run.start()` with direct pubsub subscriptions (verified in the
  installed source; only push-only transports need the wired subscription,
  and pull-mode orchestration covers queued `startAsync` runs, which this
  plugin never issues) — and one `Mastra` instance exists per tenant, so
  enabling workers would start duplicate schedulers.

## Validation

- `node --test backend/plugins/erxes-agent_api/src/modules/agents/__tests__/redis-lifecycle.integration.mjs` (from repository root; requires `redis-server` and `redis-cli`; starts its own temporary Unix-socket Redis with persistence disabled).
- Attachment smoke: send a small UTF-8 product CSV, verify the agent can use its
  rows, reopen the thread to verify prompt/chips, and confirm oversized text
  fails with a split-file instruction. Send a PNG from storage and a public CDN:
  verify the model receives pixels without a tool call, the prompt/chip survive
  reload, and unreadable/private/oversized images fail before streaming.
  Non-image binary formats remain available to download.
- Question smoke: resume a multi-question suspension with a mix of strings
  and string arrays; verify the result retains each answer and its custom text.
- `pnpm nx lint erxes-agent_api`
- `NODE_OPTIONS=--experimental-vm-modules pnpm nx test erxes-agent_api`
- Focused run without Nx (from the repository root; the
  `NODE_OPTIONS` flag is required by the QuickJS WASM loader):
  `NODE_OPTIONS=--experimental-vm-modules pnpm exec jest --config
  backend/plugins/erxes-agent_api/jest.config.ts --runInBand --forceExit`
  (includes tool-schema compatibility, agent defaults, question normalization, and tool bridge incl. the `requireApproval` predicate
  and pure executor and the shared `isGatedAgentToolCall` gate, agent-tools
  client, HTTP routes auth/isolation incl. the approve/decline contract
  (with kind-aware suspension selection and wrong-kind 409s), the ask-user
  answer/resume contract and the BYOK no-connection 400, the tenant
  code-mode flag on chat/approve/answer, the code-mode
  sandbox incl. real QuickJS execution, host-capability denial and the
  gated-tool refusal, provider
  resolution incl. the OpenAI native-path/proxy split, memory/runtime
  lifecycle, the MongoDB 4.4 workflow-snapshot codec round-trip and storage
  wrapping, BYOK multi-provider connection resolvers incl. the
  server-side models listing and the stale-model re-save refresh, tenant
  settings resolvers incl. the admin-only gating, thread list/detail
  resolvers, the `agentsThreadRemove` mutation, and the Redis Streams bus
  singleton/config plus the shared bus across tenant runtimes).
- `pnpm nx build erxes-agent_api` passes (the earlier repo-wide
  `erxes-api-shared:build` failure has been resolved upstream of this
  plugin).
- `cd backend/plugins/erxes-agent_api && npx tsc --project tsconfig.json --noEmit`
  compiles this plugin cleanly and is the reliable local type check. Under
  nodenext, un-exported deep imports need
  narrowly scoped `paths` entries to real declaration files
  (`@apollo/server/dist/esm/express4` → its `dist/cjs` declaration twin), and
  type-only imports of ESM-only packages need `'resolution-mode': 'import'`.
- **Never run an emitting `tsc` (`pnpm build`, `tsc -p tsconfig.build.json`)
  locally while `backend/erxes-api-shared/dist` is empty.** The shared
  package's stub declarations re-export its `.ts` sources, so those sources are
  pulled into this plugin's program and `tsc` writes `.js`, `.d.ts`, and
  `.js.map` artifacts *beside them* inside `backend/erxes-api-shared/src`. Those
  emitted `.js` files shadow the real sources and break other services in dev.
  Use `--noEmit` for local type checks. If artifacts appear, remove them with
  `git status --porcelain backend/erxes-api-shared` and delete every untracked
  `.js` / `.d.ts` / `.js.map` before continuing.
- Dev boot must run through `pnpm nx serve erxes-agent_api` (or `pnpm dev`
  from the plugin directory). Running `tsx` on `src/main.ts` from the repository
  root fails with `MODULE_NOT_FOUND` for
  `erxes-api-shared/utils`, because tsx then loads the root `tsconfig.json` and
  loses this plugin's `erxes-api-shared/*` → source `paths` mapping, falling
  back to the empty `dist`.
- Smoke scenario: start the service and confirm it registers as
  `erxes-agent` on port `3306`, then save two BYOK connections with
  `agentsConnectionUpsert(provider: "openai", apiKey: "...")` and
  `agentsConnectionUpsert(provider: "grok", apiKey: "...")`; re-read
  `agentsConnections` (two masked entries) and `agentsModels` (both
  providers' model lists, fetched server-side) without a restart.
- Verified boot signature (Phase 0 gate): `/health` returns HTTP 200 `ok`,
  the log shows `erxes-agent graphql api ready at
  http://localhost:3306/graphql`, `Connected to the database`, and
  `erxes-service erxes-agent joined with http://localhost:3306`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-09-21` — Kimi temperature fix and serialized stream errors

- **Summary:** `buildAgentsModelSettings` omits `temperature` for `kimi` (Moonshot rejects any value but 1), and `describeStreamError` unwraps the plain serialized error objects `@mastra/ai-sdk` passes to `onError`, so provider failures surface their real message again.
- **Affected areas:** `src/modules/agents/agent.ts`, `src/routes.ts`, route and agent tests.
- **Contracts changed:** None; `modelSettings.temperature` is now optional and absent for kimi runs.

### `2026-09-17` — Agent tools are read-only

- **Summary:** Owning services no longer annotate any data-writing tRPC procedure for agents, so manifests contain read-only procedures only.
- **Affected areas:** Core `tags`, `brands`, `products`, `productCategories`, `companies`, `customers`, `cpNotifications` routers; frontline inbox `changeStatus`; consumed manifest families documented below.
- **Contracts changed:** Removed from `/agent-tools/manifest`: `tags.create`; `brands.create`, `brands.updateOne`; `products.createProduct`, `products.updateProduct`, `products.setInventories`, `products.increaseInventories`; `productCategories.createProductCategory`, `productCategories.updateProductCategory`; `companies.createCompany`, `companies.updateCompany`; `customers.createCustomer`, `customers.updateCustomer`, `customers.tag`; `cpNotifications.create`; `inbox.conversations.changeStatus`. No procedure implementation changed; unannotated procedures stay callable over service-to-service tRPC as before.

### `2026-09-16` — MongoDB 4.4 workflow snapshot compatibility

- **Summary:** Wrap Mastra's workflow storage domain with a reversible key codec so durable suspend/resume snapshots carrying JSON-schema `$ref` keys persist on MongoDB 4.4 (which rejects `$ref` without `$id`), fixing the "The DBRef $ref field must be followed by a $id field" chat failure.
- **Affected areas:** `mongo44Compatibility.ts` (new), install in `memory.ts`, `// MongoDB 4.4.25 compatible` markers in `agent.ts` / `toolSchemaCompatibility.ts` / tests, new codec test suite.
- **Contracts changed:** None publicly; `mastra_workflow_snapshot` gains a reversible `__erxesMongo44Entries_v1` envelope for incompatible keys and reads stay backward compatible with plain snapshots.

### `2026-09-13` — Read Cloudflare Images attachment keys

- **Summary:** Fall back to the platform's CDN-aware image reader when streaming storage misses an uploaded Cloudflare Images key, preserving tenant context and image limits.
- **Affected areas:** `readFile.ts`, attachment and route regression tests.
- **Contracts changed:** None; existing upload metadata and public storage APIs are reused.

### `2026-09-13` — Supply uploaded image pixels to chat

- **Summary:** Send validated raster image bytes directly to the model and retain downloaded bytes in image tool results instead of delegating URL access to providers.
- **Affected areas:** `fileBinding.ts`, `readFile.ts`, agent instructions and attachment/route regression tests.
- **Contracts changed:** Public upload metadata is unchanged; server-prepared messages include native image file parts, images have a uniform 2 MiB read limit, and image read failures stop chat before streaming.

### `2026-09-11` — readFile tool for uploaded attachments

- **Summary:** Added `readFile({ url })` scoped to this conversation's attachments. HTTP fetches pin DNS, re-check redirects, cap size while streaming, sniff raster images, and never follow file:// or private hops.
- **Affected areas:** `readFile.ts`, request context, chat route, tests.
- **Contracts changed:** Chat agent tools include `readFile({ url })`; RequestContext may carry `threadId` and `attachmentUrls`.

### `2026-09-11` — Use platform uploads for chat attachments

- **Summary:** Composer uploads through core `/upload-file`; chat reads tenant storage keys for supported text and never fetches URLs. Removed the plugin file registry and `/agents/files` routes.
- **Affected areas:** Chat binding, composer, history chips, tests and plugin guides.
- **Contracts changed:** `data-agents-files` now carries `{name,url,type,size}`; `POST/GET/DELETE /agents/files` and `fileIds` are gone.

### `2026-09-07` — Plugin-owned product tool contracts

- **Summary:** Overlay source-reviewed nested schemas and descriptions for core product create/update/lookup tools, and reject invalid agent input before `/agent-tools/call`.
- **Affected areas:** `toolContracts.ts`, `tools.ts`, `agentTools.ts` descriptor field, tool-bridge tests.
- **Contracts changed:** `searchTools` may add `inputSchema` on reviewed tools; `callTool` can return `INVALID_TOOL_INPUT` (400) without calling the owning service.

### `2026-09-07` — Read text attachments in chat

- **Summary:** Supplies complete owner-scoped UTF-8 attachment text to the model with bounded reads, explicit failures and untrusted-data guidance.
- **Affected areas:** `fileBinding.ts`, `agent.ts`, chat route and attachment/route tests.
- **Contracts changed:** Existing chat parts add server-owned `textFileIds` and `displayText`; supported text contents persist in Mastra messages, while binary files remain download-only.

### `2026-09-06` — Attachment review fixes

- **Summary:** Reject malformed attachment metadata, guard stale binding writes, preserve all prompt text with one notice, and handle malformed upload identities without unhandled rejections.
- **Affected areas:** File routes, validation, binding/model, route tests, and real Mastra message-conversion coverage.
- **Contracts changed:** Malformed attachment payloads return 400; concurrent binding changes return 409. Storage privacy limitations are documented; shared helpers are unchanged.

