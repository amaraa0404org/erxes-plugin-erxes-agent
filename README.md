# erxes-agent — erxes plugin

Standalone erxes plugin following the [plugin contract](https://github.com/erxes/erxes/blob/main/docs/plugins/contract.md).
AI agents chat for erxes: per-user BYOK multi-provider assistant with threads,
tool approvals, ask-user prompts, artifacts, a floating widget, and a
tenant-wide code-mode setting.

- `api/` — `erxes-agent_api`: Express + Apollo Federation subgraph (port 3306),
  registers in Redis service discovery so the erxes gateway composes it.
  Also serves the SSE chat endpoints (`/agents/*`) and the `cf-os` connect-code
  routes.
- `ui/` — `erxes_agent_ui`: Rspack Module Federation remote (port 3016); core-ui
  loads `remoteEntry.js` at runtime and mounts `./config` (navigation/routes)
  plus `./erxes_agent`, `./erxes_agentSettings`, `./floatingWidget`.
- `plugin.json` — marketplace manifest (`api.address` points at the locally
  running API; `ui.entry` at the dev remoteEntry).
- `docker-compose.yml` — run the API next to a self-hosted erxes deployment.

## `vendor/` — temporary SDK tarballs (not on npm yet)

The plugin SDK packages (`@erxes/api-shared`, `@erxes/ui`,
`@erxes/ui-modules`) are not published to npm yet. Until they are, this repo
vendors locally built tarballs in `vendor/` and installs them under the
monorepo import names:

| Dep name in package.json | Tarball in `vendor/` | Provides |
| ------------------------ | -------------------- | -------- |
| `erxes-api-shared`       | `erxes-api-shared-3.0.0.tgz` | `@erxes/api-shared` (runtime) |
| `erxes-ui`               | `erxes-ui-3.0.0.tgz`         | `@erxes/ui` (types only) |
| `ui-modules`             | `erxes-ui-modules-3.0.0.tgz` | `@erxes/ui-modules` (types only) |

Built from the erxes monorepo (`plugin-sdk-v3.0.0` sources) with:

```bash
pnpm install --config.node-linker=hoisted
pnpm nx build erxes-api-shared
node scripts/plugin-sdk/build.mjs --version 3.0.0
cd dist/plugin-sdk && npm pack ./api-shared && npm pack ./ui && npm pack ./ui-modules
```

Once `plugin-sdk-v*` releases land on npm, replace the `file:../vendor/*.tgz`
specs with `"erxes-api-shared": "npm:@erxes/api-shared@^3.0.0"` (and the
`erxes-ui` / `ui-modules` equivalents) and delete `vendor/`.

## Setup

```bash
pnpm --dir api install && pnpm --dir ui install
cp api/.env.example api/.env   # set MONGO_URL, REDIS_* (JWT_TOKEN_SECRET,
                               # CF_OS_EXCHANGE_SECRET if you use cf-os routes)
```

## Dev

```bash
pnpm --dir api dev            # api on :3306 (or: docker compose up -d)
pnpm --dir ui dev             # remoteEntry.js on :3016
```

On the erxes side: `ENABLED_PLUGINS=erxes-agent`, or install at runtime via
Marketplace → Add plugin → this repo's URL.

## Release

`git tag v0.1.0 && git push --tags` — the publish workflow builds the UI
remote into `dist/<version>/erxes_agent_ui/` on GitHub Pages and pushes
`ghcr.io/<owner>/plugin-<repo>:<version>` + `:latest`. Bump
`plugin.json#version` and point `ui.entry` at the new versioned path.

## Submit to the marketplace

Open a PR adding an entry to `plugin-registry/plugins.json` in
`erxes/erxes` — `source: "github"`, your `repoUrl`, and the
`api`/`ui` block copied from your released `plugin.json`.
