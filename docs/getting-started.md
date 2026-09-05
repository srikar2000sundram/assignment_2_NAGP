# Getting Started

From a clean checkout to a running app. For a walkthrough of what to *do*
with it once it is running, see [user-guide.md](./user-guide.md).

## Prerequisites

- **Node.js 20 or newer** (built and tested on Node 24).
- **npm** — used for both projects. Do not mix in pnpm/yarn; you will get a
  second lockfile and inconsistent installs
  ([ADR-003](./decisions.md#adr-003-package-manager--npm)).

That is the whole list. No database, no Docker, no services to stand up,
**and no environment variables** — there is no `.env` anywhere. TheMealDB
uses a shared free test key that is part of the base URL in
`src/lib/api/mealdb.ts` ([api.md](./api.md), [ADR-002](./decisions.md#adr-002-recipe-data-source--themealdb)).

## The one thing to understand first

The app consumes `recipe-ui-kit` as a **real npm dependency**, not as a
source import. That is an explicit assignment requirement, and it means
there are two supported dependency modes:

| Mode | `recipe-finder-app/package.json` says | Use when |
|---|---|---|
| **Local tarball** (current) | `"@srikar_sundram/recipe-ui-kit": "file:../recipe-ui-kit/srikar_sundram-recipe-ui-kit-0.2.0.tgz"` | Developing both projects side by side, or the package is not published yet |
| **Published** | `"@srikar_sundram/recipe-ui-kit": "^0.2.0"` | After `npm publish` — see [RUNBOOK.md](./RUNBOOK.md) |

Both modes exercise the same code path: a tarball install only exposes what
the package actually publishes (`dist/`, `loader/`, and whatever the
`exports` map allows), never the raw `.ts` source. So if something would
break for a real consumer, it breaks here too
([ADR-004](./decisions.md#adr-004-published-package-name)).

## Setup

### Step 1 — build and pack the component library

```sh
cd recipe-ui-kit
npm install
npm run build          # compiles dist/ + loader/
npm pack               # produces srikar_sundram-recipe-ui-kit-0.2.0.tgz
```

### Step 2 — install the app against that tarball

```sh
cd ../recipe-finder-app
npm install            # the tarball path is already in package.json
```

If you rebuilt the library at a different version, point the app at it
explicitly:

```sh
npm install ../recipe-ui-kit/srikar_sundram-recipe-ui-kit-0.2.0.tgz
```

### Step 3 — run it

```sh
npm run dev            # http://localhost:5174
npm run dev -- --open  # ...and open a browser
```

The port is pinned (`strictPort`) so the URL is always the same.

## Running the component library on its own

The library has its own dev preview that renders each component in
isolation, outside the app — useful for working on a component without the
app's data in the way:

```sh
cd recipe-ui-kit
npm start              # http://localhost:3333
```

## Every command, both projects

**`recipe-finder-app/`**

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5174 |
| `npm run build` | Production static build into `build/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | `svelte-check` — TypeScript + Svelte template types |
| `npm run lint` | `prettier --check` then `eslint` |
| `npm run format` | Rewrite files with Prettier |
| `npm test` | Vitest once (both projects) — see [testing.md](./testing.md) |
| `npm run test:unit` | Vitest in watch mode |

**`recipe-ui-kit/`**

| Command | What it does |
|---|---|
| `npm run build` | Stencil production build (`dist/` + `loader/`) |
| `npm start` | Dev build + watch + serve on :3333 |
| `npm test` | Component + unit tests (73) |
| `npm run test:watch` | Same, in watch mode |
| `npm pack` | Produce the publishable `.tgz` |

## Verifying a clean checkout

Run this to confirm everything is wired up:

```sh
cd recipe-ui-kit    && npm run build && npm test
cd ../recipe-finder-app && npm run check && npm run lint && npm test && npm run build
```

Expected: **73** library tests pass, **114** app tests pass, zero
type/lint errors, and a build written to `build/`.

## Troubleshooting

### Dev server 404s on a file like `recipe-ui-card_7.entry.js`

You rebuilt and repacked the library while the dev server was running.
Stencil content-hashes its lazy chunk filenames, but a tarball reinstall
does not bump a version, so Vite keeps serving its stale cache.

```sh
rm -rf node_modules/.vite && npm run dev
```

The library is already excluded from Vite's pre-bundler to prevent the
worst of this ([ADR-008](./decisions.md#adr-008-recipe-ui-kit-excluded-from-vites-dependency-pre-bundler)),
but excluding it does not make Vite aware that a tarball's *contents*
changed underneath it.

### `Cannot find native binding` / `@rolldown/binding-...`

A known npm optional-dependencies bug. npm only installs the binding for
the platform that ran `npm install`, so this appears when `node_modules` is
shared between two different runtimes — most commonly a folder used from
both Windows-native Node and WSL.

The fix must be run **from the shell you will actually run `npm run dev`
in**:

```sh
rm -rf node_modules package-lock.json && npm install
```

Running it from the other side just flips the binding back.

### `EPERM: symlink` during `npm run build`

You are on Windows with an adapter that emits symlinks. The project uses
`@sveltejs/adapter-static` specifically to avoid this
([ADR-011](./decisions.md#adr-011-adapter-static-not-adapter-vercel)); if you
see this, check that `vite.config.ts` has not been switched to
`adapter-vercel`.

### Library changes are not showing up in the app

The app uses the packed tarball, not the library source, so a source edit
alone changes nothing. The full loop is:

```sh
cd recipe-ui-kit && npm run build && npm pack
cd ../recipe-finder-app && npm install ../recipe-ui-kit/srikar_sundram-recipe-ui-kit-0.2.0.tgz
rm -rf node_modules/.vite && npm run dev
```

### Favorites / recipes / meal plan disappeared

Expected — all of it lives in `localStorage`, so it is per-browser and
per-device, and clearing site data wipes it. There is no account system and
no sync ([ADR-005](./decisions.md#adr-005-state--persistence--no-backend-browser-storage-only)).
