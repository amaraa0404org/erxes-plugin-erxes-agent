# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-09-21`


## Scope

### Owns

- The `erxes-agent` Module Federation remote, served on port `3016`.
- The agents chat surface: full-page chat under `src/pages/agents`, the
  destructive-action approval prompt, thread history sidebar (including
  thread deletion), the empty-chat hero with suggestion chips, and the
  global floating widget side panel.
- The plugin settings surface under `/settings/erxes-agent/*`: the
  settings router (`ErxesAgentSettings`), the settings sidebar
  navigation (`ErxesAgentSettingsNavigation`), the opencode-style
  BYOK form at `src/pages/settings/SettingsConnectionPage.tsx` (select
  provider -> paste API key -> save; several providers can be configured
  side by side, each listed with its own entry and removable individually.
  The chat's model picker is a two-step picker over every configured
  provider's models (fetched server-side by the backend from each
  provider's /models endpoint): pick Auto or a provider, then the model
  (search box filters the list), and a
  per-turn thinking-level picker (off/minimal/low/medium/high) sits next to
  it; both selections ride along with every chat turn. The chat surfaces
  never query or manage keys; they only consume the models listing), and
  the tenant-wide code mode page at
  `src/pages/settings/SettingsCodeModePage.tsx` (admin-gated switch over
  the backend's `agentsSettings` flags; every user can read the state,
  only `manageAgentsSettings` holders can change it).
- The AI SDK chat transport, stored-history mapping, REST client, and GraphQL
  documents under `src/modules/agents`.
- The animated bot avatar: the MIT-licensed, framework-free bloub engine
  vendored under `src/modules/agents/bloub/` (unchanged upstream code) plus
  the React wrapper `src/modules/agents/components/BloubBot.tsx`.
- The artifact layer under `src/modules/agents/artifacts/`: the fence
  splitter, artifact cards with previews/downloads, and the HTML / XLSX /
  DOCX / PDF converters for files the assistant emits as tagged fences.
- Plugin navigation, routing, and the `CONFIG` contract.

### Does not own

- Backend schema, resolvers, routes, or contracts; those live in
  `erxes-agent_api`. The UI only consumes its public REST and GraphQL
  contracts.
- AI agent runtime, tool curation, or approval enforcement. The UI surfaces
  approval decisions; the backend enforces them. Workspace data (sales,
  contacts, inbox, …) is not fetched by this UI on the agent's behalf —
  there is no client-side GraphQL/tRPC fallback for the model.
- `core-ui`, `erxes-ui`, `ui-modules`, or another plugin's source.

## Current Capabilities

- Composer attachments: up to five files, 10 MiB each, uploaded through the
  platform `/upload-file` endpoint. Selecting another batch does not cancel
  earlier uploads; remove, thread switch, and unmount abort pending requests.
  Chip removal is local. Sends are disabled while uploads are pending or failed.
  Text limits (64 KiB each, 128 KiB per turn) are checked before upload.
  Sent image attachments render as responsive inline previews (up to 256px wide
  and 288px tall), with loading indicators and clickable originals. Failed
  previews fall back to filename chips. Documents keep their filename/download
  chips unchanged. Both images and chips use the platform `readImage` helper
  for storage keys and CDN URLs, in live messages and reopened history. The attachment
  tooltip explains readable formats. The backend `readFile` tool inspects
  attachment urls, including CDN image urls. History uses server-owned `textFileUrls` (legacy unread
  `contentsNotRead` is not labeled in the bubble). Server-saved `displayText` keeps
  extracted contents out of the prompt bubble. Live sends show image previews or
  document chips, with no format notice under the attachment.
- Every federation expose loads the plugin-owned `src/styles.css`; utilities use the isolated `ea:` prefix without Preflight or host overrides.
- Registers with the `core-ui` host through the `CONFIG` named export and
  contributes a navigation group named `Agents` (icon + `defaultPath`
  `erxes-agent/chat`, no panel `content`) and one module named `agents` at
  path `erxes-agent/chat`, plus a
  `settingsNavigation` sidebar group ("Agents" / "API key" / "Code mode")
  for the host settings area. With no navigationGroup content the host renders no
  secondary plugin panel: the rail click lands on the chat page directly.
- Plugin routes mount the chat page at the `chat` sub-route
  (`/erxes-agent/chat`) with the plugin root redirecting there
  (`<Route path="/" element={<Navigate to="chat" replace />} />`) and no
  catch-all route — a deep link like every other plugin so the host's
  stale-remote frame can never rewrite the URL.
- Full-page agents chat (`/erxes-agent/chat`) with a thread history sidebar,
  streaming transcript with inbox-style auto-scroll, markdown rendering,
  and a composer. The shell is responsive: the thread sidebar is permanent
  only from `lg` (1024px) up, and below that every surface — the full page
  and the floating side panel — opens the same list as a left `Sheet`
  drawer from a header button. The empty state pairs the hero and the composer as one
  centered, scroll-safe block: an animated bot playing the calm
  `CALM_FACE_CYCLE`, "How can I help you today?", "Ask anything about your
  erxes workspace", the composer itself, then four starter chips
  ("Summarize my open deals", "Draft a follow-up email", "Show overdue
  tasks", "Search my contacts") that send through the same
  `sendMessage({ text })` path the composer uses. Once a conversation
  exists the transcript fills the panel with the composer docked below.
  The same layout serves the full page, the floating side panel and mobile;
  it scales with the viewport — the hero bot shrinks (80 / 96 / 104px), and
  the block stays scroll-safe so the composer never leaves a short panel.
- Composer: one card holding the plugin-local `ChatInput` (auto-growing
  native textarea — deliberately not `erxes-ui`'s `Textarea`, which forces a
  focus shadow and scrollbar arrows inside the card), the model/thinking
  pickers as pill triggers, and the send/stop control (`IconArrowUp` /
  `IconPlayerStop`). No bot inside the composer. The toolbar is one row at
  every width: the pickers share the leftover space and truncate (the
  thinking pill drops its "Thinking:" prefix first) instead of pushing the
  send control out of the card on a phone.
- Bot avatar (`BloubBot`) used across every agents surface, always rendered
  in the design system primary (`color` defaults to `var(--primary)`, an
  indigo that matches `bg-primary` buttons): the empty-state hero
  (`CALM_FACE_CYCLE`), each assistant
  message's avatar (size 28, contextual — the `writing` pen-strokes state
  while its message streams, `wide` while an ask_user question on it awaits
  an answer, otherwise frozen on one calm idle frame via `frozenAt={0}` so
  settled rows run no animation loop), the streaming "Thinking…"
  indicator and the thread-loading state (`thinking`), the thread list's
  empty state (a `sleep` frame frozen the same way), the approval prompt
  (`alert`), the side-panel
  header (`idle`), and the floating launcher (`LAUNCHER_CYCLE`, `orbit`
  while dragged). The engine's `sample(t)` is a pure function of time; the
  wrapper owns the rAF loop, the montage cursor and the SVG.
- Streaming-lag countermeasures: `useChat` runs with the SDK-native
  `throttle: 50` (at most one message-state update per 50ms), the
  transcript renders each message through a memoized top-level `MessageRow`
  (settled `UIMessage` rows skip every per-delta re-render because their
  message object, sibling message, streaming flag, and callbacks are all
  identity-stable), `Markdown` and `MessageContent` are `React.memo`
  components with their table-repair / artifact-split work memoized on
  `content` (settled markdown is neither re-repaired nor re-parsed), and
  `ThreadList` is memoized against a memoized `threadsState` object from
  `useAgentsThreads` plus `useCallback`-stable handlers from `IndexPage`,
  `FloatingWidget`, and `ChatPanel`. The callbacks `useAgentsChat` returns
  (`sendMessage`, `submitAnswer`, `startNewConversation`, `openThread`)
  depend only on the stable SDK methods `useChat` returns (bound to a
  stable internal chat instance) and read the latest `messages`/`status`
  from refs, so `onAnswer` keeps its identity while messages stream.
- Floating launcher is the bot itself: it plays `LAUNCHER_CYCLE` so it is
  always alive, can be dragged anywhere on screen (pointer capture, clamped
  to the viewport, remembered in `localStorage` under
  `erxes-agent:launcher-position`, re-clamped on resize), switches to the
  `orbit` state while dragging, and opens the side panel on a press that
  never crossed the 4px drag threshold.
- Destructive-action approval prompts rendered inline in the transcript;
  approving or declining records the decision on the tool part and the AI SDK
  auto-resends, which the transport routes to the backend's
  `POST /agents/approve` resume endpoint. All other tool execution states
  are hidden in the transcript (no tool cards).
- ask_user questions render as a neutral, sectioned form with descriptive
  option tiles, explicit single/multiple choice indicators, and a visible
  custom-answer field for every question. Choices can be deselected; no
  selection submits automatically. One Continue button submits only after
  every question has a selection or nonblank text. Custom text accompanies
  selected choices, including batched and multi-select answers. Busy states
  disable all fields and controls. Forms are keyed by suspended tool call so
  successive questions start with fresh drafts. The suspension arrives as a `data-tool-call-suspended` data
  part; answering stages the answer (with the suspended tool call id) on
  the transport, resolves the suspended tool part locally, and sends a user
  message carrying the answer, which the transport reroutes to the backend's
  `POST /agents/answer` and processes as a normal send (the SDK's own resume
  path builds an empty streaming state, so the replayed suspension chunks
  would find no matching tool part and the whole stream would be discarded).
  The transport's chunk filter drops ONLY chunks tagged with the suspended
  tool call id; the resumed run's own tool inputs/outputs flow through so
  code-mode iterations and other tool activity stay visible. Once answered,
  the askUser tool part (`output-available`) renders an `AskUserAnswered`
  compact Q&A summary — each question with the answer beneath it — built by
  `src/modules/agents/askUserAnswers.ts` from the tool input (questions)
  and the tool result (answers: the structured `answers` array the live
  patch and backend write, or legacy `User answered:\n<q>: <a>` content).
  A single multi-select answer preserves its nested positional array. The
  card replaces the suspension prompt and survives reloads; answers are
  never rendered as user bubbles — the send marks its user message with
  `metadata.agentsAnswer`, which `MessageList` filters out of display
  (the backend no longer stores the answer as a user message either).
  Legacy threads that DID store the answer as a user message are covered
  display-side: `MessageList` hides a user bubble that directly follows
  the ask_user assistant message when its text exactly equals
  `formatAskUserAnswers(...)` of the parsed card answers (the ', '- and
  ' · '-joined legacy format).
- Loads stored threads and thread messages over GraphQL and maps them to AI
  SDK `UIMessage`s for rendering; the thread list refreshes itself through
  the `agentsThreadsChanged` subscription (debounced refetch).
- Conversation history lists wait for permissions to load and require
  `showAgents` for `erxes-agent`. Missing access displays guidance to ask an
  administrator for the Agents User group in the page sidebar, mobile drawer,
  and floating panel. Server permission denials show the same guidance.
- Conversation sidebar (`ThreadList`): sessions grouped by activity (Today /
  Yesterday / Previous 7 days / Older, derived client-side from `updatedAt`),
  the active session marked by a primary accent rail + `bg-primary/10` row,
  hover-revealed delete, skeleton rows while the first page loads, and the
  sleeping bot + "Start one" button on the empty state. Rows are text-only —
  no per-row icons (a repeated message icon down a long list reads as
  noise); timestamps use `formatDateISOStringToRelativeDateShort`. The
  hover-revealed delete is always visible below `lg` (touch has no hover);
  only the pointer layouts hide it until the row is hovered or focused.
- Thread deletion: each thread row shows a delete button that
  confirms through an `AlertDialog` and runs `AgentsThreadRemove`; deleting
  the active conversation resets the chat to a new conversation on both the
  full page and the floating widget.
- Global floating agents widget mounted on every page via
  `hasFloatingWidget`: a right-edge vertical-center chevron handle
  (fixed `right-0 top-1/2`, hidden while the panel is open) toggles a
  full-height right `Sheet` side panel with the thread sidebar (md and up)
  and the same chat surface.
- BYOK in settings: each user manages their own AI connection on the
  form at `/settings/erxes-agent/connection`
  (also reachable via the chat page header "Settings" button). The form is
  provider card grid -> API key -> save, with every provider card,
  configured row and remove-dialog title led by the provider's brand mark
  (`ProviderIcon`), a primary check badge on the selected card, a step
  reveal (the key section appears only once a provider is chosen or
  stored), a show/hide toggle on the password input, a connected-status
  row with relative `updatedAt`, and an `AlertDialog`-confirmed remove.
  Omitting `apiKey`
  keeps the stored key only when the provider is unchanged; switching
  providers requires a fresh key. The stored key is never rendered back.
  The model is always visible, never hidden: each configured entry shows
  the stored model in parentheses (`OpenAI (gpt-5.6-luna)`), each provider
  card shows the default model a fresh entry will store, and the chat
  model picker's Auto entry shows the model the server default actually
  runs (`Auto (gpt-5.6-luna)`). The chat surfaces have no key UI at all:
  chatting starts directly, and a missing key surfaces only as the
  backend's 400 error in the chat error banner.
- Chat model picker: a two-step `Popover` + `Command` picker. Step one
  (selection) lists the Auto entry (sparkles, shows the default model) and
  one row per configured provider — brand mark, provider label, model
  count, and a check when the active selection belongs to that provider.
  Step two (a provider) has a back row, a search input (autofocused,
  cmdk-filtered) and that provider's models in mono with a check on the
  active one. The trigger renders the active choice itself: sparkles +
  `Auto (model)` or the provider's mark + the mono model id.
- Code mode in settings: the tenant-wide toggle page at
  `/settings/erxes-agent/code-mode` (settings sidebar "Agents / Code
  mode"). Every agents user can read the current state
  (`AgentsSettings` query); the `Switch` is disabled unless
  `usePermissionCheck().hasActionPermission('manageAgentsSettings',
  'erxes-agent')` holds, in which case toggling saves immediately through
  `AgentsSettingsUpdate` (`refetchQueries` + success/error toasts).
  Non-admins see the live state plus a muted "Managed by your
  administrators" note. The sandbox environment renders as a fixed
  "In-process (built-in server)" card marked Default — the backend
  validates the enum, the UI does not edit it.
- Artifacts render inline in the transcript. Recognized `html`, `xlsx`,
  `docx`, and `pdf` fences are identified as soon as their opening tag arrives;
  unfinished bodies show a compact creation state while streaming and an
  interrupted state with a working Generate again action once stopped.
  Source is never rendered or executed for unfinished artifacts. Reopening
  stored interrupted replies preserves that state. Complete standalone HTML
  documents (doctype or html root) also preview; ordinary code examples and
  inline HTML fragments remain markdown.
- HTML previews are borderless and use the available transcript width (up to
  `max-w-6xl`). Prose, user messages, the thinking indicator, and the docked
  composer share that width and the same responsive horizontal gutters. A quiet
  toolbar provides title, Source/Preview, Copy, and Download. The sandbox
  reports its content height through a source- and channel-checked message;
  height is bounded to 120–12000px, with scrolling within exceptionally tall
  documents. The transcript follows asynchronous height changes only while
  the reader is near the bottom. HTML remains isolated with an opaque origin
  and a restrictive CSP injected before generated content.
- Spreadsheet previews use a read-only table and the same CSV parser as
  their native `.xlsx` download; docx previews/downloads are editable Word
  documents, and PDFs use the native viewer. Heavy converters are lazy-loaded.
  Generation failures offer Retry, unavailable document downloads are disabled,
  and copy/download failures show explicit feedback.
- Two-tier responsive transcript typography (base 15px / md 17px) for
  markdown, user bubbles, composer, and thread titles, plus responsive
  transcript spacing and gaps (tighter below `sm`) and horizontally
  scrollable markdown tables (`w-max min-w-full` inside an
  `overflow-x-auto overscroll-x-contain` wrapper, so a wide table scrolls
  instead of squashing its columns), with polished
  markdown styling (paragraph spacing, blockquote, hr, list markers and
  spacing, bordered code blocks with mono resets, styled inline code,
  underlined links, bordered tables), a dashed-border reasoning
  collapsible, and `whitespace-pre-wrap break-words` user bubbles that
  keep multi-line paste line breaks.

## Architecture

| Area                | Path                                           | Responsibility                                    |
| ------------------- | ---------------------------------------------- | ------------------------------------------------- |
| Host contract       | `src/config.tsx`                               | Exports `CONFIG` consumed by `core-ui`            |
| Routing             | `src/modules/ErxesAgentMain.tsx`               | Declares the plugin's main routes (chat at `chat` sub-route, root redirects) |
| Settings routing    | `src/modules/ErxesAgentSettings.tsx`           | Declares the plugin's settings routes (`connection`, `code-mode`) |
| Settings navigation | `src/modules/ErxesAgentSettingsNavigation.tsx` | Settings sidebar group ("Agents" / "API key" / "Code mode") |
| Chat page           | `src/pages/agents/IndexPage.tsx`               | Full-page chat with thread sidebar (`lg`+), drawer below |
| History drawer      | `src/modules/agents/components/ThreadsDrawer.tsx` | Controlled left `Sheet` wrapping `ThreadList` for every width below `lg` |
| Settings page       | `src/pages/settings/SettingsConnectionPage.tsx`| Brand-mark BYOK form (save/remove connection)     |
| Code mode page      | `src/pages/settings/SettingsCodeModePage.tsx`  | Tenant-wide code mode toggle (admin-gated switch + fixed sandbox environment card) |
| Floating widget     | `src/widgets/FloatingWidget.tsx`               | Right-edge chevron handle + full-height `Sheet` side panel |
| Chat hook           | `src/modules/agents/hooks/useAgentsChat.ts`    | `useChat` wrapper (`sessionScope: 'page' \| 'widget'`): thread tracking, approval resend, ask-user answer resume, surface-scoped session restore, history |
| Threads hook        | `src/modules/agents/hooks/useAgentsThreads.ts` | Loads the user's agents threads                   |
| Connection hook     | `src/modules/agents/hooks/useAgentsConnection.ts` | Loads the user's BYOK connection               |
| Provider icons      | `src/modules/agents/components/ProviderIcon.tsx` | Inline brand marks per provider (OpenAI, xAI, Kimi; Kimi Code = Kimi mark + code badge) |
| Provider picker     | `src/modules/agents/components/ProviderPicker.tsx` | Provider whitelist, brand-mark card grid, and label helpers (settings form) |
| Settings hook       | `src/modules/agents/hooks/useAgentsSettings.ts` | Loads the tenant-wide agents settings (code mode flag) |
| Transport           | `src/modules/agents/transport.ts`              | `DefaultChatTransport` subclass; routes approval resends to `/agents/approve` and ask-user answer sends to `/agents/answer` |
| History mapping     | `src/modules/agents/mapStoredMessages.ts`      | Stored Mastra messages → AI SDK `UIMessage`s      |
| Attachments | `src/modules/agents/agentsFiles.ts`, `uploadAgentsFile.ts`, `components/AttachedFiles.tsx` | Platform upload metadata, inline image previews, document chips, and `readImage` downloads |
| In-flight prompt | `src/modules/agents/inFlightPrompt.ts` | Text/attachment prompt serialization; reads legacy plain-text sessions |
| REST URLs           | `src/modules/agents/api.ts`                    | `/agents/chat`, `/agents/approve`, `/agents/answer` SSE endpoint URLs |
| GraphQL documents   | `src/modules/agents/graphql/connection.ts`     | `AgentsConnection*` BYOK operations               |
| GraphQL documents   | `src/modules/agents/graphql/settings.ts`       | `AgentsSettings` query + `AgentsSettingsUpdate` mutation |
| GraphQL documents   | `src/modules/agents/graphql/threads.ts`        | `Agents*` thread list/detail operations and the `AgentsThreadsChanged` subscription |
| Components          | `src/modules/agents/components/*`              | Chat panel (transcript + empty state + composer layouts), message list, parts, approval, tool call helpers, composer, `ChatInput`, markdown, thread list (with delete), provider picker, `BloubBot` avatar wrapper |
| Markdown repair     | `src/modules/agents/components/markdownRepair.ts` | `repairTables(text)` pre-pass normalizing malformed pipe tables before `react-markdown`: missing separator row, several rows collapsed onto one line, and a separator row merged onto the header line |
| Bot cycles          | `src/modules/agents/botCycles.ts`              | Curated module-level montages (`CALM_FACE_CYCLE`, `LAUNCHER_CYCLE`) with stable references |
| Bot avatar (vendored) | `src/modules/agents/bloub/*`                 | MIT-licensed framework-free bloub engine (upstream, unchanged) + `README.md` credit/license; the pure `engine.sample(t)` the `BloubBot` wrapper renders |
| Artifacts            | `src/modules/agents/artifacts/*`             | `parseArtifacts` fence splitter, `MessageContent`/`ArtifactCard` rendering, sandboxed `HtmlPreview` + lazy previews (`SpreadsheetPreview` / `DocxPreview` / `PdfPreview`), converters (`csv`, `mdBlocks`, `xlsx`, `docx`, `pdf`), `download` |
| Types               | `src/modules/agents/types.ts`                  | REST and stored-message shapes                    |
| Federation          | `module-federation.config.ts`                  | Remote name, exposes, and shared library policy   |

## Contracts

### Provides

- Module Federation remote with container name `erxes_agent_ui`
  (underscores — MF container names cannot contain dashes), exposing
  `./config`, `./erxes_agent`, `./erxes_agentSettings`, and
  `./floatingWidget`.
- `CONFIG` with `name: 'erxes_agent'` (the underscored MF remote name the
  host uses to build `${name}_ui` for `loadRemote`),
  `permissionName: 'erxes-agent'` (the dashed backend plugin name used
  for permission checks), `path: 'erxes-agent'`,
  `hasFloatingWidget: true`, `settingsNavigation`, a navigation group
  named `Agents` with `defaultPath: 'erxes-agent'`, and one module named
  `agents` at path `erxes-agent`.

### Consumes

- Backend REST (via `${REACT_APP_API_URL}/pl:erxes-agent`):
  `POST /agents/chat` (SSE), `POST /agents/approve` (SSE),
  `POST /agents/answer` (SSE), `POST /agents/chat/reconnect` (SSE or 204
  for cross-replica live replay). Chat attachments use `data-agents-files`
  parts with platform `{name,url,type,size}` metadata. Uploads go to core
  `/upload-file`; chips open through `readImage` / `/read-file`.
  Server-saved `textFileUrls` and `displayText` are consumed for history.
- Backend GraphQL: `AgentsConnections`, `AgentsModels`,
  `AgentsConnectionUpsert`, `AgentsConnectionRemove` (the former singular
  `AgentsConnection`/`AgentsConnectionUpdate` operations are gone),
  `AgentsThreads`, `AgentsThreadDetail`, `AgentsThreadRemove`, the
  `AgentsThreadsChanged` subscription (refetch signal only), and the
  tenant settings pair `AgentsSettings` / `AgentsSettingsUpdate`.
- `ai` (`DefaultChatTransport`, `UIMessage`, part type guards,
  `lastAssistantMessageIsCompleteWithApprovalResponses`) and
  `@ai-sdk/react` (`useChat`), matched to the backend's AI SDK major.
- Artifact dependencies (root `package.json`, introduced via upstream PR
  `erxes/erxes#9180`): `docx` (Word generation), `exceljs` (xlsx export),
  `docx-preview` (Word preview) and `@react-pdf/renderer` (PDF
  generation). The `@univerjs/presets` + `@univerjs/preset-sheets-core`
  packages are still installed for back-compat but no longer imported;
  they can be dropped from `package.json` after a `pnpm install`.
- `erxes-ui` for `IUIConfig`, navigation items, `Breadcrumb`, `Button`,
  `buttonVariants`, `Sheet`, `AlertDialog`, `Input`, `Label`, `Textarea`,
  `Collapsible`, `Avatar`, `Spinner`, `Badge`, `toast`, and
  `REACT_APP_API_URL`.
- `ui-modules` for `PageHeader` and the permission gate
  (`usePermissionCheck`, `hasActionPermission(action, pluginName)`).
- `react-markdown` for assistant text, `@tabler/icons-react` for icons, and
  `react-router` / `react-router-dom` for routing.

## Data and State

- Server state via Apollo Client for the BYOK connection
  (`AgentsConnection` query; `AgentsConnectionUpdate` and
  `AgentsConnectionRemove` with `refetchQueries`) and the thread history
  (`AgentsThreads` query with a subscription-driven debounced refetch;
  `AgentsThreadDetail` lazy query with `network-only` for opening a
  thread; `AgentsThreadRemove` with `refetchQueries`).
- Chat state via the AI SDK's `useChat`; the plugin holds the conversation's
  thread id in a ref + React state. The id is generated client-side on the
  first send (`crypto.randomUUID()`) and pinned to every turn in the request
  body — the `X-Agents-Thread-Id` response header is advisory only, because
  a cross-origin browser cannot read a custom response header unless the
  gateway lists it in `Access-Control-Expose-Headers` (it does not).
- The active run id (one `crypto.randomUUID()` per normal send, kept across
  approval/answer resumes) lives in a ref + `canReconnect` state and is
  persisted per thread in `sessionStorage`
  (`agents-active-run:<threadId>`, shared by every surface — a durable
  run belongs to the thread, so a run started in the floating widget is
  resumable from the full page and vice versa; only the selected-thread
  pointer is surface-scoped): cleared on clean completion
  and on terminal errors via `onFinish` (retained only on abort,
  disconnect, or a pending approval/ask_user suspension), cleared eagerly
  on a non-ok normal-chat HTTP response via the transport's `fetch`
  middleware (network rejections preserve it). The thread's in-flight
  prompt (`agents-in-flight-prompt:<threadId>`, written by `sendMessage`
  and cleared with the run entry; plain text for text-only turns, JSON text and
  public file metadata for attachments) is the mid-run source for the prompt
  bubble: Mastra persists nothing until the run finishes, so on restore
  `openThread` synthesizes the prompt message (id
  `<threadId>:in-flight-prompt`) while the stored transcript does not
  yet contain it. Each surface also persists
  its selected thread (`agents-selected-thread:<scope>`) and restores it
  once on mount through `openThread` — which resumes a stored live run,
  and after a resume that did NOT replay an active run (the transport
  reports the reconnect outcome; 204 means the run finished while the
  surface was away) re-reads the thread detail (bounded retries) so the
  finished reply appears without a manual refresh — so a browser refresh
  reopens the same conversation. No Jotai atoms.

## Local Invariants

- `useAgentsThreads` checks the action-level `showAgents` permission, not
  plugin visibility. While permissions load or client access is denied, skip the list
  query, subscription, and manual refetch; hide cached rows and cancel pending
  subscription refreshes when access is revoked. Server checks remain the
  authority; unrelated query failures retain their original error message.
- Never add a client-side GraphQL or tRPC executor the model can invoke.
  Chat talks only to this plugin's REST (`/agents/chat`, `/agents/approve`,
  `/agents/answer`, `/agents/chat/reconnect`) plus platform `/upload-file`
  and `/read-file`, and its own
  GraphQL (BYOK, threads, settings). Workspace records are reached by the
  backend two-tier bridge (`searchTools` / `callTool`) as the acting user;
  permission denials arrive as tool results in the stream. Do not work
  around a missing tool by querying another plugin from the UI.
- In-flight reconciliation compares both text and attachment URLs so distinct
  file-only prompts do not collapse into an older `Uploaded files` turn.
- Image previews are presentation-only: preserve upload metadata, document chip
  behavior, and the existing `readImage` URL resolution. A failed preview must
  retain access to the original file. Keep thumbnails bounded on narrow screens.
- Attachment contents are extracted server-side from tenant storage keys.
  Do not claim legacy attachments were read based on MIME. Preserve server
  `textFileUrls` and `displayText` through history mapping.
- The plugin ships its own Tailwind stylesheet (`src/styles.css`) and EVERY
  expose entry (`config.tsx`, `ErxesAgentMain.tsx`, `ErxesAgentSettings.tsx`,
  `FloatingWidget.tsx`) imports it. The host compiles plugin classes only at
  HOST build time (`core-ui`'s `@source '../../plugins/'`), so a remote
  deployed against a stale host renders unstyled without this stylesheet.
  Removing any expose import re-opens that gap for that surface.
- `src/styles.css` scope rules: `@source './'` scans ONLY this plugin's
  sources, and every plugin-owned Tailwind literal in TS/TSX uses the `ea:`
  prefix-first syntax. The stylesheet imports only Tailwind's theme and
  utilities layers with `prefix(ea)`; it MUST NOT import Preflight or add a
  global base/reset selector because every expose can load it on any host page.
  Shared `erxes-ui`/`ui-modules` component classes stay owned by the host
  stylesheet. The `@theme` block mirrors the host's token MAPPINGS
  (`--color-primary: var(--primary)`, text-size/radius/shadow overrides) so
  generated utilities resolve identically — but token VALUES (oklch colors,
  fonts) are never redeclared: the host `:root` remains the single source of
  truth and per-token value overrides here would fight host theming. Keep the
  two `@theme` blocks in sync when the host's changes.
- `rspack.config.ts` must keep the `test: /\.css$/` → `postcss-loader` +
  `type: 'css'` rule (mirrors `core-ui`); without it the stylesheet does not
  compile through Tailwind or emit as an MF css chunk.

- `core-ui` discovers this remote from the `ENABLED_PLUGINS` environment
  variable and maps each entry to `<name>_ui`, so the enabled entry must be
  `erxes-agent`.
- Module Federation container/remote names cannot contain dashes. Nx
  normalizes the `erxes-agent_ui` project to the container global
  `erxes_agent_ui`, and the host loads exposes via `${CONFIG.name}_ui`,
  so `CONFIG.name` must stay the underscored `erxes_agent` while
  `CONFIG.permissionName` keeps the dashed backend name `erxes-agent` for
  permission checks. The `plugin.name`-derived expose key (`./erxes_agent`)
  must stay underscored to match, and the main module's named export is
  `ErxesAgent` to match the host's PascalCase resolution candidate.
- `src/config.tsx` must keep the `CONFIG` named export.
  `PluginConfigsProvidersEffect` loads `<remote>/config` and reads `CONFIG`;
  renaming it breaks plugin registration.
- Exposed modules use named exports. The host resolves a component by trying
  `default`, the PascalCase module name, and then the first component-shaped
  export. `FloatingWidget` intentionally also provides a default export so the
  floating-widget loader resolves it directly.
- The chat page lives at the `chat` sub-route: the main router keeps
  `<Route path="/" element={<Navigate to="chat" replace />} />` plus
  `<Route path="chat" element={<IndexPage />} />` and no `path="*"`
  catch-all. Every in-plugin link to the chat (breadcrumbs, rail
  `defaultPath`, module `path`) must use `/erxes-agent/chat` — never the
  bare plugin root, because the host can render a previous plugin's remote
  for one frame under the new URL and that remote's own root redirect would
  rewrite `/erxes-agent` (e.g. to `/erxes-agent/tasks`). The settings
  router keeps its relative index redirect (`<Navigate to="connection"
  replace />`) and likewise no catch-all; the old catch-all redirected every
  unknown path and 404'd users leaving for other plugins. The BYOK form
  lives in the settings surface: the host mounts `./erxes_agentSettings` at
  `/settings/erxes-agent/*`, so the form URL is
  `/settings/erxes-agent/connection` and every in-plugin link to it
  (chat page header "Settings" button) must use that path.
- The chat surfaces must not render any API-key prompt, pointer row, or
  gating button: key management lives exclusively in the settings surface,
  chatting starts directly, and a missing key surfaces only as the
  backend's 400 error in the chat error banner. Do not reintroduce a
  connection-state check in `ChatPanel` — its `useAgentsConnection` query
  is display-only (it feeds the model picker's Auto label) and must never
  disable or block anything.
- The settings expose key must stay `./erxes_agentSettings`
  (underscored `${CONFIG.name}Settings`): the host's
  `getPluginsSettingsRoutes` resolves `${plugin.name}_ui/${plugin.name}Settings`
  for every plugin and mounts it under `/settings/${plugin.path}/*`.
- Starter chips must send through the exact same path as the composer
  (`ChatPanel` calls `sendMessage({ text })` directly for both, mirroring the
  composer's `onSend`); do not introduce a second send path. The empty state
  (hero + composer + chips) lives in `ChatPanel` — `MessageList` is
  transcript-only and has no empty branch.
- Artifact security invariants (non-negotiable):
  - Only complete artifacts execute or download. The `html | xlsx | docx |
    pdf` fence allow-list is unchanged; standalone HTML documents are also
    recognized. Unclosed fences/documents render status only, never source or
    a partial iframe. Untagged/non-artifact code fences remain code, including
    nested fence examples. The parser normalizes language tags before lookup.
  - The HTML preview iframe uses `sandbox="allow-scripts"` ONLY (opaque
    origin — no parent DOM/cookie/storage access), `srcDoc`,
    `referrerPolicy="no-referrer"`, and injects a strict CSP meta as the
    first policy (model-provided CSPs may only intersect and tighten). Do
    NOT add `allow-same-origin`, `allow-popups`, or an "open in new tab"
    action for HTML: a top-level `blob:`/`srcdoc` document inherits our
    origin.
  - Every heavy library (`exceljs`, `docx`, `docx-preview`,
    `@react-pdf/renderer`) loads behind a dynamic
    `import()`/`React.lazy` boundary (`ArtifactCard.tsx`); the module
    federation entry must not gain a static import of any of them.
  - The spreadsheet preview is a read-only HTML table built by
    `parseDelimitedTable` (`converters/csv.ts`) — the SAME parser the
    download path uses, so what renders matches what downloads. Do not
    reintroduce an editable grid or a second parsing path; an empty parse
    must keep rendering the explicit "Empty table" state.
  - Generated docx files must stay native, fully editable OOXML (real
    heading styles, `Table`/`TableRow`/`TableCell`, `TextRun` formatting —
    no rasterized or protected output).
- The transcript renders only approval prompts for tool parts; do not
  reintroduce tool-execution cards or spinner rows for tool states.
- Transcript auto-scroll must follow the inbox ScrollArea viewport pattern
  (`ScrollArea.Root`/`ScrollArea.Viewport` with a `viewportRef` and
  distance-from-bottom tracking, jumping via `scrollTop = scrollHeight`
  inside `setTimeout(0)`); it pauses while the user is scrolled up
  (near-bottom threshold 120px), re-arms when the transcript empties, and
  always jumps to the bottom once thread history finishes loading.
- Code mode settings gating mirrors the backend: the switch saves through
  `AgentsSettingsUpdate` only for `manageAgentsSettings` holders
  (`usePermissionCheck` with the dashed plugin name `'erxes-agent'`);
  everyone else gets a read-only view. The environment card is
  display-only — the backend's `AGENTS_CODE_MODE_ENVIRONMENTS` enum is the
  single source, and only `in-process` exists.
- The BYOK API keys are write-only in the UI: `agentsConnections` never
  returns it, the settings form renders it only in a password input (with a local
  show/hide toggle), and an empty `apiKey` on upsert must be omitted (not
  sent as an empty string, which clears that provider's stored key).
  Omitting `apiKey` keeps that provider's stored key. Each provider entry
  is independent — adding one never touches another provider's key. The
  stored model is the provider default (the backend refreshes it to the
  current default on every re-save without an explicit model); the chat
  may override it per turn via the model picker, but the settings form
  never asks for a model or base URL. `PROVIDER_OPTIONS.defaultModel` in
  `ProviderPicker.tsx` is display-only copy mirroring the backend's
  `PROVIDER_DEFAULTS` — keep the two in sync when a default changes.
- Model/thinking selection lives in `useAgentsChat` (refs feed the
  transport's `getRequestSelection`) and rides along with EVERY chat body
  and the approve body — the transport must keep sending it on the approval
  resend so the resumed run continues on the same provider/model/thinking.
  The model picker's "Auto" entry reports `''` directly (the `Popover` +
  `Command` picker has no empty-value sentinel; the old `__auto__` Select
  sentinel is gone). Its label shows the actual default model via the
  `autoModel` prop (`ChatPanel` passes the first configured connection's
  stored model — what the server default runs); it falls back to
  "Auto (server default)" only while that value is unknown.
- Provider brand marks live only in `ProviderIcon.tsx` (inline SVG paths:
  OpenAI from simple-icons CC0, xAI + Kimi from svgl.app; Kimi Code is the
  Kimi mark plus a code badge — there is no separate Kimi Code logo). A new
  `PROVIDER_OPTIONS` entry needs a matching `provider ===` branch there or
  it falls back to the sparkles tile. The model picker's trigger renders
  the active choice manually (mark + mono model id, or sparkles for Auto)
  — keep that content in sync with the picker rows; the composer pill
  keeps the manual chevron `Combobox.Trigger` appends, and `ThinkingPicker`
  stays on `erxes-ui` `Select`, whose trigger appends its own.
- The `navigationGroup` in `src/config.tsx` must NOT define `content` (or
  `subGroup`): the host renders a secondary plugin panel whenever group
  content exists, and the chat page must fill the width directly with no
  extra sidebar step. The rail click alone navigates straight to the chat
  page via the activity `defaultPath`. (`IUIConfig.navigationGroup.content`
  became optional in `erxes-ui` to enable this.)
- `src/modules/agents/bloub/` is vendored MIT code (see its `README.md`):
  keep it pristine — the only edits are rewriting `gaze.ts`'s three `@/`
  imports to relative `./bot/*` and the deliberate plugin-added `writing`
  state in `states.ts` (registered in `StateId`, `STATES`, `POSES` and
  `SEQUENCE`, marked with a comment). Do not "clean up" the French comments,
  the non-null assertions (upstream style; they surface as lint warnings,
  not errors), or the measured constants (rounding them breaks the avatar).
  All bot rendering goes through the React wrapper `BloubBot.tsx`; never
  add a second consumer of the engine.
- The chat input is the plugin-local `ChatInput` (`src/modules/agents/components/ChatInput.tsx`),
  a chrome-free auto-growing native textarea — NOT `erxes-ui`'s `Textarea`,
  whose focus shadow and fixed height produced a bright ring inside the
  composer card and scrollbar arrows on a one-line field. Both chat
  inputs (composer and approval decline reason) use it; do not swap them
  back to the shared `Textarea`.
- The empty state is one layout in `ChatPanel`, reused by the full page,
  the floating side panel and mobile. It must stay responsive and
  scroll-safe (`overflow-y-auto` outer + `min-h-full` centered inner) and
  its avatar must play a curated, size-stable montage
  (`CALM_FACE_CYCLE` from `botCycles.ts` — only states that keep the
  `baseBody` circle), never the full 14-state `defaultCycle()`: in a
  narrow panel the montage's "thinking" three-dots state reads as a
  loading spinner and its size-varying states float awkwardly.
- Responsive invariants (the chat is used from a 320px phone to an ultrawide
  desktop; breakpoints are Tailwind's defaults, applied as CSS classes so
  there is no first-paint jump):
  - The thread sidebar is permanent only from `lg` (1024px) up. Below that
    BOTH surfaces that show threads — `IndexPage` and `FloatingWidget` —
    must mount `ThreadsDrawer` and give it a visible trigger, because a
    phone has no other route back to a stored conversation. Never reintroduce
    a hidden sidebar without a drawer fallback (the floating panel's old
    `hidden md:block` left phones with no history access at all).
  - The drawer is controlled by the surface that owns the trigger; selecting
    a thread or starting a new conversation closes it. Keep both surfaces on
    the same `ThreadsDrawer` component rather than duplicating the sheet.
  - Layout is CSS-only (`hidden lg:block`, `lg:hidden`, …). Do not add a JS
    breakpoint hook: `erxes-ui`'s `useIsMobile` is a 1024px `matchMedia`,
    which would disagree with the CSS classes the moment they diverge.
  - Anything revealed on hover must have a non-hover fallback below `lg`
    (see the thread row's delete button): touch devices never hover.
  - The composer toolbar stays one row at every width. Pickers shrink and
    truncate; they must never wrap or push the send control out of the card.
  - Fixed pixel heights (hero avatar, document previews) get a smaller value
    below `sm`; HTML previews size to content; the composer's bottom padding is
    `pb-[max(0.75rem,env(safe-area-inset-bottom))]` so it clears the iOS home
    indicator without adding dead space elsewhere.
  - Wide content scrolls in place: markdown tables inside an
    `overflow-x-auto` wrapper, code blocks with `whitespace-pre-wrap
    break-words`. Nothing may widen the transcript horizontally.
  - `ChatPanel`'s root keeps `flex-1` because both surfaces mount it inside
    a flex-row wrapper (`main` on the page, the sheet's content row in the
    floating widget). Without it the panel shrinks to its content's width and
    pins to the left edge, so the empty state's `mx-auto` block can never
    center.
- Every `cycle` array passed to `BloubBot` must be a stable module-level
  constant (`botCycles.ts`) — an unstable reference restarts playback on
  each render. Each block duration must stay above the engine's block
  floor (the longest state morph, ~0.6s) or the block is cut mid-morph.
  The same stability rule applies to any `shuffle` pool: pass a
  module-level constant, never an inline array. `shuffle` picks each next
  state randomly among the pool
  minus the state on screen (never an immediate repeat), holding each its
  measured duration from the vendored `makeBlock`, and memory stays O(1).
- The assistant message avatar is contextual: the streaming tail shows the
  `writing` state (a plugin-added bloub state — pen strokes with a fading
  ink trail; NOT upstream code, see the vendored-engine invariant), a
  message with a pending ask_user suspension shows `wide`, and every
  settled message renders frozen on one calm idle frame (`frozenAt={0}`):
  settled transcript rows and the thread list's sleeping empty-state bot
  run no animation loop at all. Only the streaming/submitted tail, a
  pending ask_user avatar, the thread-loading state, the hero, the approval
  prompt, the side-panel header, and the floating launcher animate.
- The memoization chain is what keeps streaming cheap: `MessageRow`,
  `Markdown`, `MessageContent`, and `ThreadList` must stay `React.memo`
  components fed only identity-stable props — `useCallback` handlers in
  `ChatPanel` (approval), `IndexPage` and `FloatingWidget` (thread
  new/select/deleted), `useAgentsThreads` returning a memoized result
  object, and `useAgentsChat` callbacks that depend only on the stable SDK
  methods (latest `messages`/`status` read from refs). Do not reintroduce
  inline callbacks, per-render objects, or a `[chat]`-style dependency on
  the whole `useChat` return object in those positions, or every streamed
  delta re-renders the whole transcript and sidebar again.
- Thread continuity is client-owned: `useAgentsChat` generates the thread id
  on the first send (`crypto.randomUUID()` via `ensureThreadId`, called from
  the wrapped `sendMessage`) and the transport includes it in every request
  body (`threadId`), including approve/answer resumes. Do NOT restore
  header-based thread tracking — the backend's `X-Agents-Thread-Id` response
  header is invisible to the cross-origin browser (the gateway's
  `cors(corsOptions)` never lists it under `Access-Control-Expose-Headers`),
  so relying on it silently breaks every conversation into per-turn fresh
  threads with no memory. The header capture in the transport stays as
  advisory only.
- Stop-before-switch: `openThread` awaits `stop()` before replacing the
  shared SDK transcript, and `startNewConversation` awaits `stop()` before
  clearing it, so in-flight chunks from the previous thread cannot land
  after the switch. The durable run may continue server-side; the old
  thread's `sessionStorage` run entry is kept so reopening it can still
  reconnect.
- Ask-user answers must resume through `POST /agents/answer` (threadId-keyed
  resume), never a fresh `sendMessage` against `/agents/chat`. But the answer
  request must travel as a NORMAL SEND, not `chat.resumeStream()`: the SDK's
  resume path builds its streaming state from an empty message, so the
  resumed stream's leading `tool-output-available` chunk finds no matching
  tool part and the SDK discards the ENTIRE stream (the symptom was a 200
  SSE with nothing rendered and nothing stored). `submitAnswer` therefore
  stages the answer on the transport's `consumePendingAnswer` seam, marks
  the suspended tool part answered locally via `chat.setMessages`, and calls
  `chat.sendMessage({ text: answer })`; `sendMessages` consumes the staged
  answer, reroutes that one request to `/agents/answer`, and drops
  `tool-output-available` chunks en route (they cannot match the fresh
  streaming state). `MessageList` hides an answered suspension card by
  toolCallId. The staged answer is consumed exactly once, and
  `startNewConversation` clears any stale one.
- All bot avatars render in the design system primary: `BloubBot`'s `color`
  prop defaults to `var(--primary)` and no caller overrides it. Catalog ids
  resolve through the vendored skins map; any other CSS color passes
  through verbatim. Inks are applied via CSS `fill` (style), NOT the SVG
  `fill` attribute — the attribute does not resolve `var(--…))` values.
- The floating launcher is draggable: pointer capture, viewport clamping,
  `orbit` while dragging, and persistence under
  `erxes-agent:launcher-position`. A press that never crossed the 4px
  drag threshold opens the panel — keep the `movedRef` click suppression,
  otherwise every drag also opens the side panel at release.
- Approval resume must go through `POST /agents/approve` (threadId-keyed),
  not the AI SDK's native whole-transcript resend. The transport detects the
  approval decision in the last assistant message and reroutes that one
  request; identity still comes from gateway cookies/headers, never the body.
- The `ai` / `@ai-sdk/react` versions must stay on the same major as the
  backend so the SSE `UIMessage` wire format matches.
- Serve port `3016` must stay unique across `frontend/plugins/*` and
  `frontend/private-plugins/*`.
- Keep `module-federation.config.ts` exposes, `CONFIG` paths, and real routes
  aligned.
- Do not import Radix primitives directly or from another plugin.

## Validation

- History access smoke: with `showAgents` absent, open the page and floating
  panel history and verify the Agents User guidance with no `AgentsThreads`
  query/subscription. Grant access and reload: history and live updates work.
- Question smoke: answer a batch using custom-only text, selected options with
  added details, and multiple selections; verify one Continue submission,
  disabled controls while sending, and identical summaries after reopening.
- `pnpm nx lint erxes-agent_ui` (inferred from `eslint.config.js`)
- `pnpm nx build erxes-agent_ui`
- `pnpm nx test erxes-agent_ui` (inferred from `jest.config.ts`)
- Type-check from repository root: `pnpm exec tsc --project
  frontend/plugins/erxes-agent_ui/tsconfig.app.json --noEmit` (shared-library
  errors can block the whole program; check plugin diagnostics separately).
- Composer smoke: upload guidance stays out of the composer layout; hover or
  keyboard-focus the paperclip to see the limits, and click it to select files.
- Image preview smoke: send an image with a PDF, verify the image thumbnail
  opens the original and the PDF remains a filename chip; reopen the thread and
  repeat in the floating panel and a narrow viewport. A failed image preview
  falls back to a clickable chip.
- Attachment smoke: select two batches while the first uploads, remove one
  pending file, switch threads, and refresh a live attachment turn. Verify
  remaining uploads finish, removed uploads do not reappear, chips survive
  history reload, and file-only send/download work. Send a small product CSV and
  verify the agent can use its rows; reopen to check the included-text notice
  and clean prompt bubble. Verify a legacy CSV still says unread, a PDF remains
  download-only, and oversized text gets the server's explicit error.
- Smoke scenario: add `erxes-agent` to `ENABLED_PLUGINS`, serve `core-ui`
  and this remote, then confirm the navigation group appears, the chat page
  at `/erxes-agent/chat` fills the width with no secondary plugin panel next to
  it and shows the centered empty state (bot in the design system primary
  blue playing the calm face cycle,
  composer under the heading, starter chips — clicking a chip
  sends it; the composer input shows NO focus ring/outline while typing),
  streaming a reply moves the composer to the docked bottom bar,
  each assistant message shows a small
  frozen bot avatar and the "Thinking…" indicator shows the three-dots bot,
  opening a stored thread shows the thinking bot as its loading state,
  a destructive tool call shows an approval prompt led by the alert bot,
  the thread list's empty state shows the sleeping bot, hovering a thread
  row reveals a working delete confirm,
  `/settings/erxes-agent/connection` (settings sidebar "Agents / API
  key", chat header "Settings") saves and removes the connection — the
  provider cards and configured rows lead with their brand marks, the
  provider cards show each default model in parentheses
  (`OpenAI (gpt-5.6-luna)`), the configured entry shows the stored model
  in parentheses, the chat model picker's Auto entry shows the actual
  default model, and opening the picker shows the selection menu (Auto +
  one row per provider with model counts), stepping into a provider shows
  a search box filtering its mono model rows, and the trigger shows the
  active choice's mark and model — chatting
  with no stored key shows only the backend's "Add your API key" error
  banner with no other key UI,
  and the floating bot launcher: shows the calm face cycle, dragging it
  moves it anywhere (rings spin while dragging) and the spot survives a
  reload, while a simple click opens the full-height side panel with
  threads and chat on any page, whose empty state matches the full page
  without floating or clipping (also on mobile).
- Smoke (artifacts): ask the agent for "a quarterly sales report as a
  spreadsheet" and confirm the reply renders an artifact card (title +
  Copy/Download icons only) instead of a code block — the spreadsheet
  renders as a read-only table and Download produces a real `.xlsx` that
  opens in Excel, an html artifact's preview runs
  scripts but sends no external network requests (devtools) and cannot
  touch the parent page, a docx download opens in Word/Google Docs with
  real, editable headings/tables, a pdf preview uses the native viewer, a
  mid-stream artifact shows a creation state without source, stopping shows
  Generate again, and reopening the thread preserves complete/interrupted
  states. HTML grows to its content without a border; Source/Preview toggles
  correctly and narrow previews never widen the parent transcript.
- Smoke (code mode settings): open `/settings/erxes-agent/code-mode`
  (settings sidebar "Agents / Code mode") — as an admin the `Switch`
  reflects the tenant state, toggling saves immediately with a toast and
  survives a reload; as a non-admin the switch is disabled and the
  "Managed by your administrators" note shows; the environment card reads
  "In-process (built-in server)" marked Default.
- Smoke (responsive): at 320 / 375 / 768 / 1024 / 1440px, and in a short
  landscape phone, confirm the thread sidebar is inline from `lg` up and a
  header button opens it as a left drawer below that — on BOTH the full page
  and the floating side panel — that picking a thread closes the drawer and
  loads it, the header actions stay on one line with their labels folded
  away below `sm`, the empty state keeps the composer inside the panel with
  the hero scaled down, the composer toolbar stays a single row with the
  pickers truncating rather than the send control escaping the card, a wide
  markdown table scrolls sideways without widening the transcript, and a
  thread row's delete button is reachable without hovering.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-09-21` — Chat page moved to `/erxes-agent/chat` sub-route

- **Summary:** The rail link and plugin routes now use a `chat` sub-route (root redirects to it) so the host's stale-remote frame can't redirect the URL when switching plugins.
- **Affected areas:** `src/modules/ErxesAgentMain.tsx`, `src/config.tsx`, breadcrumb links in the agents and settings pages.
- **Contracts changed:** None — the Module Federation expose and GraphQL are unchanged; only the in-plugin route/nav path moved.

### `2026-09-17` — Actionable conversation-history permissions

- **Summary:** Wait for history access before fetching threads and explain missing access with Agents User group guidance across all history surfaces.
- **Affected areas:** `src/modules/agents/hooks/useAgentsThreads.ts`, `src/modules/agents/__tests__/useAgentsThreads.test.tsx`.
- **Contracts changed:** None.

### `2026-09-13` — Inline image attachment previews

- **Summary:** Sent and stored image attachments show clickable inline previews with loading/error states; document filename chips are unchanged.
- **Affected areas:** `components/AttachedFiles.tsx`, `__tests__/AttachedFiles.test.tsx`.
- **Contracts changed:** None.

### `2026-09-11` — Hide attachment format copy from the prompt bubble

- **Summary:** Live and unread attachment turns show chips only; the CSV/TXT send notice is no longer rendered in the transcript.
- **Affected areas:** `agentsFiles.ts`, `AttachedFiles.tsx`, tests.
- **Contracts changed:** None.

### `2026-09-11` — Use platform uploads for chat attachments

- **Summary:** Composer posts files to core `/upload-file`; chips open through `readImage`. Removed the plugin file API client.
- **Affected areas:** Composer, upload helper, attachment chips, in-flight prompt matching and tests.
- **Contracts changed:** Attachment metadata is `{name,url,type,size}`; no `/agents/files` client.

### `2026-09-07` — Quieter attachment guidance

- **Summary:** Moved persistent file-limit and format guidance into the attachment button's tooltip without changing uploads.
- **Affected areas:** `src/modules/agents/components/Composer.tsx`, `src/modules/agents/__tests__/Composer.test.tsx`.
- **Contracts changed:** None.

### `2026-09-07` — Text attachment support and truthful history

- **Summary:** Explains readable text formats and limits, distinguishes server-confirmed inclusion from legacy unread files, and keeps extracted payloads out of prompt bubbles.
- **Affected areas:** Attachment helpers/components, composer, history mapping, in-flight prompt persistence and tests.
- **Contracts changed:** Consumes server `textFileIds` and `displayText`; outgoing metadata no longer asserts `contentsNotRead`, and in-flight prompts no longer add a download-only notice.

### `2026-09-06` — Attachment lifecycle review fixes

- **Summary:** Fixed independent upload cancellation, validated upload responses, normalized browser MIME aliases and converted filenames, and preserved attachments during live-run refresh without duplicate notices.
- **Affected areas:** Composer, upload/download helpers, prompt persistence, and component/XHR tests; removed redundant transport serialization and its helper-only tests.
- **Contracts changed:** Attachment metadata uses existing message parts and the existing in-flight prompt sessionStorage key; REST and resume endpoints are unchanged.

### `2026-04-08` — Chat file attachments (upload/download/history)

- **Summary:** Composer paperclip uploads to the plugin file API (octet-stream, max 5 / 10MiB). Sends `data-agents-files` parts; chips download via authenticated GET. Attachments are stored; contents are not supplied to the AI. Drafts abort on thread change. Remove is local-only.
- **Affected areas:** `Composer.tsx`, `ChatPanel.tsx`, `transport.ts`, `agentsFiles.ts`, `AttachedFiles.tsx`, `MessagePart.tsx`.
- **Contracts changed:** Chat JSON may include `fileIds` derived from the newest user message; approve/answer/reconnect unchanged.

### `2026-09-05` — No client-side GraphQL fallback for agent tools

- **Summary:** Documented that the UI never executes other plugins' GraphQL
  or tRPC as an agent fallback; workspace permission checks stay on the
  backend `/agent-tools/call` path.
- **Affected areas:** Plugin scope and local invariants.
- **Contracts changed:** None.

