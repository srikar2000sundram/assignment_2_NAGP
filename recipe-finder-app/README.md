# recipe-finder-app

The SvelteKit application half of the **Recipe Finder & Meal Planner**
assignment. Consumes UI primitives from the published
[`recipe-ui-kit`](../recipe-ui-kit) npm package. See the repo root
[`../README.md`](../README.md) for the full setup/assumptions/deliverables
writeup, and [`../docs`](../docs) for architecture, decisions, flows, the
data model, and the TheMealDB API reference this app was built against.

## Stack

Svelte 5 (runes) · SvelteKit 2 · TypeScript · Vite · ESLint + Prettier ·
Vitest — scaffolded with `sv create`.

## Requirements

Node.js 20+ (developed against Node 24) and npm.

## Setup

```sh
npm install
```

This app depends on `@srikar_sundram/recipe-ui-kit` as a regular npm
dependency, resolved straight from the registry — never as a source
import. There's also a local-tarball mode for iterating on the library
before publishing a new version; both modes, and the rebuild loop, are in
[`../docs/getting-started.md`](../docs/getting-started.md).

## Developing

```sh
npm run dev            # dev server at http://localhost:5174
npm run dev -- --open  # ...and open it in a browser
```

## Checking

```sh
npm run check   # svelte-check (types)
npm run lint    # prettier --check + eslint
npm run test    # vitest, run once — 114 tests
```

Tests run in two Vitest projects: `server` (node, no `window` — pure logic
and the API layer against a mocked `fetch`) and `client` (real Chromium —
the runes stores against real `localStorage`). Inventory and edge cases:
[`../docs/testing.md`](../docs/testing.md).

## Building

```sh
npm run build     # production build
npm run preview   # preview it locally
```

This app uses `@sveltejs/adapter-static` and builds to `build/` as a plain
static site. That isn't a compromise: the app has no server-side code at
all — no `load` functions, no `+page.server.ts`, no hooks — so there is
nothing to run on a server.

Every route prerenders except `/recipes/[id]` and its `edit` child, whose
ids can't be known at build time; those are served by the `200.html`
fallback and rendered on the client. `vercel.json` carries the matching
rewrite. Deploy steps: [`../docs/RUNBOOK.md`](../docs/RUNBOOK.md#step-3--deploy-to-vercel).

## Routes

| Route                | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `/`                  | Recipe Discovery — search, browse, filter (composed) |
| `/recipes/[id]`      | Recipe details                                       |
| `/recipes/new`       | Add a recipe                                         |
| `/recipes/[id]/edit` | Edit a recipe you created                            |
| `/favorites`         | Favorited recipes                                    |
| `/meal-plan`         | Weekly meal planner                                  |

Full routing map, per-route rendering mode and the Stencil component
prop/event/slot contracts: [`../docs/architecture.md`](../docs/architecture.md).

## Source layout

| Path                  | Holds                                                                               |
| --------------------- | ----------------------------------------------------------------------------------- |
| `src/routes/`         | Routes — orchestration and markup only                                              |
| `src/lib/api/`        | TheMealDB client + response normalization                                           |
| `src/lib/search/`     | Pure search/filter set algebra + curated ingredient options                         |
| `src/lib/stores/`     | `favorites`, `mealPlan`, `userRecipes` runes stores + the SSR-safe storage wrapper  |
| `src/lib/validation/` | Recipe form business rules                                                          |
| `src/lib/types/`      | `Recipe`, `RecipeRef`, `Weekday`                                                    |
| `src/app.css`         | `--ruik-*` design tokens (which also theme the Stencil components) + layout classes |

The rule: routes orchestrate, `src/lib` computes. Anything worth testing
lives in `src/lib`, and `src/lib` never imports from `src/routes`.
