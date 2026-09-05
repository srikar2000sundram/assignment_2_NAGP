# Requirements Traceability

Every requirement in `Recipe_Finder_Meal_Planner_Assignment_v2.pdf`, mapped
to the code that implements it and the tests that cover it. The point of
this file is that "nothing is missed" should be *checkable*, not asserted.

Paths are relative to the repo root. `app/` = `recipe-finder-app/`,
`kit/` = `recipe-ui-kit/`.

Status key: **✅ Done** · **⏳ Needs your account** (prepared, awaiting a
credentialed command — see [RUNBOOK.md](./RUNBOOK.md))

---

## Stack

| Requirement | Status | Evidence |
|---|---|---|
| Svelte 5 | ✅ | `svelte@^5.56`, runes throughout (`$state`/`$derived`/`$effect`); `runes: true` forced in `app/vite.config.ts` |
| SvelteKit | ✅ | `@sveltejs/kit@^2.63`, file-based routing in `app/src/routes/` |
| StencilJS | ✅ | `@stencil/core@4.44`, 7 components in `kit/src/components/` |

## Functional — Recipe Discovery

| Requirement | Status | Implementation | Tests |
|---|---|---|---|
| Search for recipes | ✅ | `<recipe-ui-search-bar>` → `searchChange` → `searchRecipes()` in `app/src/lib/api/mealdb.ts` | `search-bar.edge.cmp` (8), `mealdb.test.ts` search block |
| Browse recipes | ✅ | Default view, `searchRecipes('')` — `app/src/routes/+page.svelte` | `compose.test.ts` — browse fallback cases |
| Filter recipes | ✅ | Three axes — category, cuisine, **main ingredient** — via `filterByCategory/Area/Ingredient`; options from `list.php` + `app/src/lib/search/ingredients.ts` | `filter-chip-group.edge.cmp` (10), `mealdb.test.ts` filter block |
| …combined with search | ✅ | `app/src/lib/search/compose.ts` — union within an axis, intersect across axes; search is one more axis | `compose.test.ts` (21) |
| Display recipes in an organized manner | ✅ | `<recipe-ui-card>` grid, "Your Recipes" section, result count, skeleton/empty/error states | `card.slot.cmp` + `card.cmp` (12) |

## Functional — Recipe Details

| Requirement | Status | Implementation | Tests |
|---|---|---|---|
| Dedicated recipe details page | ✅ | `app/src/routes/recipes/[id]/+page.svelte` | Manual pass ([testing.md](./testing.md#manual-test-pass)) |
| Complete details incl. **ingredients** | ✅ | `normalizeIngredients()` folds `strIngredient1..20` into an array; rendered as a name+measure list | `mealdb.test.ts` — sparse/null/trim cases |
| …and **instructions** | ✅ | `instructions` field, rendered with whitespace preserved | `mealdb.test.ts` — null→`''` case |
| Resolves both recipe kinds | ✅ | `userRecipes.get(id)` first, else `lookupRecipe(id)` | `stores.svelte.test.ts` — `get` cases |

## Functional — Recipe Management

| Requirement | Status | Implementation | Tests |
|---|---|---|---|
| Add recipes | ✅ | `app/src/routes/recipes/new/+page.svelte` + `userRecipes.create()` | `stores.svelte.test.ts` (10 userRecipes), `form.edge.cmp` (16) |
| Edit recipes created by the user | ✅ | `app/src/routes/recipes/[id]/edit/+page.svelte` + `userRecipes.update()`; gated on `source === 'user'` | `stores.svelte.test.ts` — update/preserve-fields cases |
| Delete recipes created by the user | ✅ | Two-step confirm on the detail page **and** in the card footer slot; `userRecipes.remove()` | `stores.svelte.test.ts` — delete + 6 cascade cases |
| Validate recipe input before saving | ✅ | `app/src/lib/validation/recipe.ts`, errors fed back via the form's `errors` prop; native `required` as the first layer | `recipe.test.ts` (23), `form.edge.cmp` error cases |

## Functional — Favorites

| Requirement | Status | Implementation | Tests |
|---|---|---|---|
| Add recipes to favorites | ✅ | Heart on every card + detail page → `favorites.add/toggle()` | `stores.svelte.test.ts` (9), `card.cmp` favoriteToggle |
| Remove recipes from favorites | ✅ | Same control toggles off; also cascade on delete | `stores.svelte.test.ts` — remove/toggle/cascade |
| View all favorite recipes | ✅ | `app/src/routes/favorites/+page.svelte`, resolving refs freshly on read | Manual pass |

## Functional — Weekly Meal Planner

| Requirement | Status | Implementation | Tests |
|---|---|---|---|
| Create a weekly meal plan | ✅ | `app/src/lib/stores/mealPlan.svelte.ts` — one slot per `Weekday`, 7-day shape always present | `stores.svelte.test.ts` (8) |
| Assign recipes to days of the week | ✅ | Two entry points: picker on `/meal-plan`, and **Add to meal plan** on any recipe's detail page | `stores.svelte.test.ts` — assign; `meal-slot.cmp` — `assign` emission |
| **Modify** planned meals | ✅ | Filled-slot **Change** control (emits the existing `assign`); assigning overwrites | `meal-slot.cmp` — change-control case; `stores.svelte.test.ts` — overwrite case |
| **Remove** planned meals | ✅ | ✕ on a filled slot → `mealPlan.unassign()` | `meal-slot.cmp` — `remove`; `stores.svelte.test.ts` — unassign |

## npm Publishing

| Requirement | Status | Evidence |
|---|---|---|
| Package the library as a reusable library | ✅ | `kit/package.json` — `exports` map, `files: [dist/, loader/, CHANGELOG.md]`, `dist` + `dist-custom-elements` + `loader` output targets |
| Publish to npm under an appropriate name | ✅ | Published as **`@srikar_sundram/recipe-ui-kit@0.2.0`**, public — [https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit](https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit). Scoped because the unscoped name was claimed by an unrelated package before release |
| Follow versioning best practices | ✅ | Semver at **0.2.0**, bump policy in [architecture.md §7](./architecture.md#7-versioning), [`kit/CHANGELOG.md`](../recipe-ui-kit/CHANGELOG.md), `prepublishOnly` guard against shipping a stale build |
| Consume the published package, not source | ✅ | `recipe-finder-app` depends on `"@srikar_sundram/recipe-ui-kit": "^0.2.0"`, resolved from `registry.npmjs.org` (see `package-lock.json`). It sees only `dist/`, `loader/` and the `exports` map — never the library source. |

## Integration

| Requirement | Status | Evidence |
|---|---|---|
| Pass data via component **properties** | ✅ | Every component; richest cases are `options`/`selected` (arrays), `recipe` (object), `initialValue`/`errors` (objects) — see the [contract table](./architecture.md#component-contracts) |
| Handle **custom events** in SvelteKit | ✅ | All 8 events handled: `cardClick`, `favoriteToggle`, `searchChange`, `filterChange`, `formSubmit`, `cancel`, `assign`, `remove`, `close` |
| Use **slots** where applicable | ✅ | `modal-dialog` default slot ← the picker card grid; `card` default slot ← Edit/Delete for own recipes (with the `stopPropagation` fix + tests) |
| Use the components as part of the main experience | ✅ | All 7 components on the primary path; no route renders its own card/form/modal markup |

## Deliverables

| Deliverable | Status | Where |
|---|---|---|
| Source code — SvelteKit app | ✅ | `recipe-finder-app/` |
| Source code — StencilJS library | ✅ | `recipe-ui-kit/` |
| README with setup instructions | ✅ | [`../README.md`](../README.md) + [getting-started.md](./getting-started.md) |
| README with assumptions made | ✅ | [`../README.md#assumptions-made`](../README.md#assumptions-made) |
| Starting the development server | ✅ | [getting-started.md#step-3--run-it](./getting-started.md#step-3--run-it) |
| npm package link | ✅ | [https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit](https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit) |
| GitHub repository link(s) | ✅ | [https://github.com/srikar2000sundram/assignment_2_NAGP](https://github.com/srikar2000sundram/assignment_2_NAGP) — one repository, per [assumptions.md](./assumptions.md#tooling) |
| Deployed application URL | ✅ | [https://assignment-2-nagp.vercel.app](https://assignment-2-nagp.vercel.app) — static build on Vercel, verified: home page, all prerendered routes, and a direct hit on the client-rendered `/recipes/[id]` fallback all return 200 |

## Quality gates (not required by the PDF, held anyway)

| Gate | Status |
|---|---|
| TypeScript / `svelte-check` | ✅ 0 errors, 0 warnings across 375 files |
| ESLint + Prettier | ✅ clean |
| Automated tests | ✅ 193 passing (73 library + 120 app) |
| Production build | ✅ `npm run build` succeeds |
| Accessibility basics | ✅ ARIA on interactive components, keyboard activation, focus-visible styling |
| Dark mode | ✅ token-level, no per-component work |

## Known gaps

Stated rather than hidden — the reasoning is in
[testing.md](./testing.md#what-is-not-covered-and-why):

- No end-to-end route tests; the thin route layer is covered by the manual pass.
- No tests against the live TheMealDB (all `fetch` is mocked).
- `randomRecipe()` is implemented and tested but no route uses it.
- `recipe-ui-modal-dialog`'s `footer` slot is implemented and tested but unused.
