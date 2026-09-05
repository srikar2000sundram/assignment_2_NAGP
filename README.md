# Recipe Finder & Meal Planner

A recipe discovery, management, favorites and weekly meal-planning app,
built as a **SvelteKit 2 / Svelte 5** application that consumes a reusable
**StencilJS** web-component library installed as an npm package.

Assignment brief: [`Recipe_Finder_Meal_Planner_Assignment_v2.pdf`](Recipe_Finder_Meal_Planner_Assignment_v2.pdf).

| Piece | What it is | Readme |
|---|---|---|
| [`recipe-finder-app/`](recipe-finder-app) | Svelte 5 + SvelteKit application | [readme](recipe-finder-app/README.md) |
| [`recipe-ui-kit/`](recipe-ui-kit) | StencilJS component library (7 components) | [readme](recipe-ui-kit/readme.md) |
| [`docs/`](docs) | Architecture, guides, tests, assumptions | [index](#documentation) |

## Links

| | |
|---|---|
| npm package — `@srikar_sundram/recipe-ui-kit` | ✅ [https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit](https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit) |
| GitHub repository (both projects) | ✅ [https://github.com/srikar2000sundram/assignment_2_NAGP](https://github.com/srikar2000sundram/assignment_2_NAGP) |
| Deployed application URL | ✅ [https://assignment-2-nagp.vercel.app](https://assignment-2-nagp.vercel.app) |

All three are live.

## Quickstart

Requires **Node.js 20+** and **npm**. No database, no Docker, no `.env`.

```sh
cd recipe-finder-app
npm install            # pulls @srikar_sundram/recipe-ui-kit from npm
npm run dev            # http://localhost:5174
```

Longer version, including the two dependency modes and troubleshooting:
[`docs/getting-started.md`](docs/getting-started.md).

## What it does

Five feature areas, one per functional requirement in the brief — the
click-by-click walkthrough is [`docs/user-guide.md`](docs/user-guide.md):

- **Recipe Discovery** — debounced name search, browse, and two multi-select
  filter axes (cuisine, main ingredient), with every result restricted to
  vegetarian and vegan recipes. Search and filters **compose**: selections
  union within an axis and intersect across axes, so a search term narrows
  your filtered set instead of replacing it.
- **Recipe Details** — dedicated page per recipe with every ingredient and
  measurement plus full instructions, for both API and user-created recipes.
- **Recipe Management** — create, edit and delete your own recipes, with
  two-layer validation and field-level errors.
- **Favorites** — add/remove from any card or detail page, and a page
  listing them all.
- **Weekly Meal Planner** — assign a recipe to any weekday, **change a
  planned meal in place**, or remove it. Reachable both from the plan and
  from any recipe's detail page.

## Verify it

```sh
cd recipe-ui-kit        && npm run build && npm test
cd ../recipe-finder-app && npm run check && npm run lint && npm test && npm run build
```

Expected: **193 tests pass** (73 library + 120 app), zero type errors, zero
lint errors, and a production build in `recipe-finder-app/build/`.

## Assumptions made

The brief leaves some things open. Short version here; the full reasoning
for each is in [docs/assumptions.md](docs/assumptions.md).

- **Recipe data source** — [TheMealDB](https://www.themealdb.com/api.php)'s
  free test key, so there's no signup or API-key setup to run this.
- **No backend or database** — favorites, user recipes and the meal plan
  persist in the browser's `localStorage`. Per-browser, per-device data,
  no account system, no sync.
- **Recipe management applies to your own recipes only.** API recipes are
  read-only, per the brief's wording *"edit recipes created by the user"*.
- **The app only ever shows vegetarian or vegan recipes**, everywhere —
  discovery, your own recipes, favorites, the meal plan. Not in the
  original brief; added afterward, and it applies unconditionally.
- **The main-ingredient filter is a curated, vegetarian-only shortlist**,
  not TheMealDB's full ~600-item ingredient list.
- **Deletion uses an inline two-step confirm** rather than a native
  `window.confirm()` dialog.
- **One recipe per day** in the meal plan — no breakfast/lunch/dinner
  sub-slots.
- **The app is a static site** — no server-side code at all, so it deploys
  to Vercel as static output.
- **Package manager: npm** throughout, matching the brief's own wording.

## How the two projects fit together

The app does **not** import the library from source. It depends on
`@srikar_sundram/recipe-ui-kit@^0.2.0`, resolved from `registry.npmjs.org`
(see `recipe-finder-app/package-lock.json`), and can only see what that
package publishes — `dist/`, `loader/` and whatever the `exports` map
allows.

Data crosses the boundary as **props**, and facts come back as
**CustomEvents**; slots carry host-owned markup into the library's
components. No Stencil component fetches data, reads app state, or knows
this app exists.

## Documentation

Start with whichever matches what you need:

| Doc | For |
|---|---|
| [getting-started.md](docs/getting-started.md) | Setting it up and running it, plus troubleshooting |
| [user-guide.md](docs/user-guide.md) | Doing each task in the app, requirement by requirement |
| [architecture.md](docs/architecture.md) | How it is built — diagrams, routing, the Stencil contract, state, key flows, versioning |
| [requirements-traceability.md](docs/requirements-traceability.md) | Every brief requirement → the code → the tests |
| [testing.md](docs/testing.md) | Test strategy, full case inventory, edge cases, known gaps |
| [assumptions.md](docs/assumptions.md) | What was assumed where the brief was silent, and why |
| [data-model.md](docs/data-model.md) | `Recipe` shape, `localStorage` schema, referential integrity |
| [api.md](docs/api.md) | TheMealDB endpoints, response normalization, caveats |
| [RUNBOOK.md](docs/RUNBOOK.md) | Publish, push and deploy — the commands used to reach the state above |
