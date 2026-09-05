# Getting Started

From a clean checkout to a running app. For a walkthrough of what to *do*
with it once it is running, see [user-guide.md](./user-guide.md).

## Prerequisites

- **Node.js 20 or newer** (built and tested on Node 24).
- **npm** — used for both projects. Do not mix in pnpm/yarn; you will get a
  second lockfile and inconsistent installs.

That is the whole list. No database, no Docker, no services to stand up,
**and no environment variables** — there is no `.env` anywhere. TheMealDB
uses a shared free test key that is part of the base URL in
`src/lib/api/mealdb.ts` ([api.md](./api.md), [assumptions.md](./assumptions.md#recipe-data)).

## The one thing to understand first

The app consumes `recipe-ui-kit` as a **real npm dependency**, not as a
source import. That is an explicit assignment requirement, and it means
there are two supported dependency modes:

| Mode | `recipe-finder-app/package.json` says | Use when |
|---|---|---|
| **Published** (current) | `"@srikar_sundram/recipe-ui-kit": "^0.2.0"` | Normal use — resolves from the npm registry |
| **Local tarball** | `"@srikar_sundram/recipe-ui-kit": "file:../recipe-ui-kit/srikar_sundram-recipe-ui-kit-0.2.0.tgz"` | Iterating on both projects at once, without publishing a version per change |

Both modes exercise the same code path: a tarball install only exposes what
the package actually publishes (`dist/`, `loader/`, and whatever the
`exports` map allows), never the raw `.ts` source. So if something would
break for a real consumer, it breaks here too.

## Setup

### Step 1 — install the app

```sh
cd recipe-finder-app
npm install            # pulls @srikar_sundram/recipe-ui-kit from npm
```

That is all that is needed to run the app: the component library comes from
the registry like any other dependency.

### Step 2 — (optional) build the library from source

Only needed if you are changing the components. See *Library changes are not
showing up in the app* under Troubleshooting for the full rebuild loop.

```sh
cd recipe-ui-kit
npm install
npm run build          # compiles dist/ + loader/
npm pack               # produces srikar_sundram-recipe-ui-kit-0.2.0.tgz
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

Expected: **73** library tests pass, **120** app tests pass, zero
type/lint errors, and a build written to `build/`.

## Troubleshooting

### Recipe cards / search bar / meal slots render as empty tags

If `recipe-ui-*` elements show up in the DOM but render nothing, the app is
almost certainly importing `recipe-ui-kit`'s lazy loader instead of the
`dist-custom-elements` modules — its per-component chunk is fetched via a
runtime-computed path Vite's production bundler can't statically analyze, so
that file never lands in the build. Check `src/routes/+layout.svelte`: it
should import each component individually (`recipe-ui-kit/recipe-ui-card`,
etc.), never `recipe-ui-kit/loader`. If you see the loader import, that's a
regression.

### Dev server cache seems stale after rebuilding the library

If you rebuild and repack the library while the dev server is running, Vite
can keep serving an old cached copy:

```sh
rm -rf node_modules/.vite && npm run dev
```

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
`@sveltejs/adapter-static` specifically to avoid this; if you see this,
check that `vite.config.ts` has not been switched to `adapter-vercel`.

### Library changes are not showing up in the app

The app consumes the *published* package, not the library source, so a
source edit alone changes nothing. To test a library change before
publishing it, switch the app to the local tarball:

```sh
cd recipe-ui-kit && npm run build && npm pack
cd ../recipe-finder-app && npm install ../recipe-ui-kit/srikar_sundram-recipe-ui-kit-0.2.0.tgz
rm -rf node_modules/.vite && npm run dev
```

Switch back with `npm install @srikar_sundram/recipe-ui-kit@^0.2.0` once the
change is published.

### Favorites / recipes / meal plan disappeared

Expected — all of it lives in `localStorage`, so it is per-browser and
per-device, and clearing site data wipes it. There is no account system and
no sync ([assumptions.md](./assumptions.md#no-backend)).
