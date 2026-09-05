# Decisions Log

The non-obvious calls on this project, in order, with the problem that
forced each one. For *what* got built, see [architecture.md](./architecture.md);
this is just the reasoning.

---

## ADR-001: Project layout — two sibling projects, one repository

The brief wants two things that depend on each other: a Stencil library and
a SvelteKit app that consumes it. The natural move is an npm workspace so
both can be edited at once — I avoided that, because a workspace makes it
too easy to link the local source and never notice something wouldn't have
survived being published. So `recipe-ui-kit/` and `recipe-finder-app/` kept
separate `package.json`s and `node_modules`, with the app installing the
library from a packed tarball ([ADR-004](#adr-004-published-package-name))
until it could install the real thing.

That called for two git repositories at first. It ended up as one —
[assignment_2_NAGP](https://github.com/srikar2000sundram/assignment_2_NAGP) —
because the deliverables ask for a single "Link to github repository," and
because the thing two repos were guarding against is already handled by
something stronger: the app depends on `@srikar_sundram/recipe-ui-kit@^0.2.0`
resolved from `registry.npmjs.org`, so `recipe-ui-kit/src` sitting one
directory away is invisible to it regardless of how many repos it's in. The
library lost its own git history in the merge, which costs nothing here —
it's on npm, so people install it rather than clone it. The two projects
still don't share `node_modules`; it's still not a workspace.

---

## ADR-002: Recipe data source — TheMealDB

I compared TheMealDB, Spoonacular, and Edamam. Spoonacular has better data
but a low free-tier quota I didn't want to risk a reviewer hitting.
Edamam needs two secrets and stricter attribution. TheMealDB just stays
out of the way: a shared test key baked into the URL, no signup, and
everything Recipe Discovery needs — search, category/area/ingredient
filters, full detail by id.

The real consequence: TheMealDB recipes are read-only, so "add/edit/delete"
had to become a separate kind of recipe the app owns itself
([data-model.md](./data-model.md)) rather than something layered on top of
API data.

---

## ADR-003: Package manager — npm

npm for both projects, mainly because the brief itself says "npm package"
and "npm Publishing Requirement." Anything else is one more mental
translation and one more install for no benefit.

---

## ADR-004: Published package name

I checked `recipe-ui-kit` was free on the registry (a 404) and shipped it
unscoped everywhere — configs, docs, install instructions — since an
unscoped name reads better than `@someone/recipe-ui-kit`. Publishing had to
wait until the library was done, so in the meantime the app installed it
from a local `npm pack` tarball rather than a workspace link, specifically
because a tarball only exposes what the package actually publishes
(`dist/`, `loader/`) — the same surface a real consumer would see.

That held until it didn't. When I came to publish, the name had been taken
four days earlier, in the gap between my check and my publish. So it ships
as `@srikar_sundram/recipe-ui-kit` instead. I didn't reach for another free
unscoped name, because that's exactly how this happened — free today proves
nothing about tomorrow, and a scoped name can't be taken out from under you.
The rename touched ten import sites and every install instruction in these
docs, which is the real cost of the original choice: "reads cleaner" wasn't
worth a namespace race. Nothing architectural moved — same tags, same
contracts, just a different string naming the package.

---

## ADR-005: State & persistence — no backend, browser storage only

Favorites, user recipes, and the meal plan need to persist, and the
obvious answer is a backend with a database. I skipped it: nothing in the
brief asks for multi-user accounts or cross-device sync, and standing up
hosting and a database wouldn't demonstrate anything the grading criteria
care about. So everything lives in `localStorage`, behind three small
runes-based stores — simpler to run (`npm run dev`, no `.env`, nothing to
seed) and it satisfies every requirement as written. The honest trade-off,
stated plainly in the README: this is per-browser data, gone if you clear
site storage.

---

## ADR-006: Component boundary between Stencil and Svelte

The rule: Stencil owns anything purely presentational and
framework-agnostic — a card, a meal slot, a debounced search input.
SvelteKit owns anything with real logic behind it — routing, fetching,
state. A component takes data through props and reports back through
`CustomEvent`s; it never reaches into a store or calls `fetch` itself. The
moment a "reusable" component depends on this app's store shape, it stops
being a portable web component. This is also just what the Integration
Requirement describes, so it wasn't extra work — it's the shape you land
on anyway once you take it seriously. The upkeep cost is a
[contract table](./architecture.md#component-contracts) I have to update by
hand whenever a prop or event is renamed, which happened at least once to
dodge native DOM collisions (`recipeTitle`, not `title`).

---

## ADR-007: Theming through inherited CSS custom properties

Shadow DOM blocks outside stylesheets, so a component library normally
needs a theme prop, an importable stylesheet, or `::part()` to be themed by
its host. I used none of those. Every colour, radius, and font is a
`--ruik-*` custom property set once on `:root` in the app, and each
component reads it as `var(--ruik-color-primary, <fallback>)`. Custom
properties are one of the few things that cross shadow boundaries, so this
themes all seven components from one place with no API surface to version
— and dark mode turned out to be a second `@media` block with zero
component changes, since nothing but tokens ever gets defined locally. The
cost: the token names are now an implicit contract, and renaming one means
every component silently falls back rather than failing loudly.

---

## ADR-008: `recipe-ui-kit` excluded from Vite's dependency pre-bundler

**Superseded** — the app no longer imports the lazy loader, so this
workaround no longer applies. See
[ADR-013](#adr-013-drop-the-lazy-loader-import-dist-custom-elements-modules-directly).

Kept for the record: rebuilding and repacking the library a few times made
the dev server start 404ing on lazy chunk files, because Vite's dependency
scanner pre-bundles the loader's internal dynamic imports and caches them
by filename. Stencil content-hashes those filenames on every rebuild, but a
tarball reinstall doesn't bump a version, so Vite kept serving a stale
cache. `optimizeDeps.exclude` fixed the symptom without fixing the cause —
which is exactly why it eventually needed a real fix instead.

---

## ADR-009: Discovery — search intersects filters rather than overriding them

The first version treated search as a mode switch: type something and the
filter chips were ignored. That's a defensible reading of "search and
filter," but it's not what anyone actually expects from a search box
sitting above filter chips, and it showed the moment I used the app instead
of building it — pick a cuisine, type a name to narrow it down, and the
cuisine filter silently vanishes.

So search became one more constraint: selections union within an axis,
intersect across axes, and a search term intersects too rather than
overriding anything. That logic lives in a pure module,
`app/src/lib/search/compose.ts`, with no fetching in it — which is what
made the interesting edge cases testable without a browser: an empty
search result means something different from no search at all, and
`filter.php` returning bare summaries while `search.php` returns full
detail meant intersecting naively would have stripped the category badge
off every card. `mergePreferDetail()` exists for exactly that.

---

## ADR-010: Curated ingredient filter options

`list.php?i=list` returns roughly 600 ingredients — unusable as a chip row,
since most match one or two recipes and the row would dwarf the page.
Categories and areas are small enough to show exhaustively; ingredients
aren't. A searchable combobox would have meant a new Stencil component with
real keyboard complexity for one filter axis, so instead
`app/src/lib/search/ingredients.ts` holds a hand-picked shortlist, each
value checked against the live API to confirm it's spelled the way
`filter.php?i=` expects and actually returns recipes.

---

## ADR-011: `adapter-static`, not `adapter-vercel`

`adapter-vercel` failed to build on Windows with `EPERM: symlink` — it
writes a symlink Windows won't allow without Developer Mode. Rather than
shrug and leave it to CI, I checked what this app actually needs from an
adapter: nothing. No `load` functions, no `+page.server.ts`, no hooks —
every byte of data comes from TheMealDB or `localStorage`
([ADR-005](#adr-005-state--persistence--no-backend-browser-storage-only)).
So `adapter-static` isn't a workaround, it's an accurate description —
builds on any OS, deploys to Vercel with no configuration.

Two things that forced: `/recipes/[id]` and its `edit` child can't be
prerendered, since the id isn't known at build time, so they're served by
the adapter's fallback page instead; and the first real deploy still failed
with "No Output Directory named dist found," because this project has no
`svelte.config.js` (the adapter lives in `vite.config.ts` instead), so
Vercel's framework detection fell back to generic Vite and guessed wrong.
`vercel.json` now pins `"outputDirectory": "build"` explicitly.

---

## ADR-012: Where validation lives, and why there are two layers

`<recipe-ui-form>` has no business rules — Title and Instructions are
`required` for baseline UX, nothing more. The actual rules live in
`app/src/lib/validation/recipe.ts`, because a 120-character title limit is
a fact about this app's data model, not about recipe forms in general;
baking it into the component would mean every future consumer inherits a
rule they never asked for. What I didn't expect: the two layers aren't
redundant. The browser's `required` catches an empty field instantly with
no JavaScript, but it's perfectly happy with `"   "` — three spaces is a
non-empty value as far as HTML is concerned. The app layer is what catches
whitespace-only input, the character limit, and an ingredient row with a
measure but no name.

---

## ADR-013: Drop the lazy loader, import dist-custom-elements modules directly

The most serious bug the app shipped with, and it survived every deploy
because every check I'd run — `svelte-check`, ESLint, Vitest, `curl`
against the deployed URL — only ever confirmed a page loaded, never that
its JavaScript worked. Discovery, browse, and the meal plan all appeared
broken while adding a recipe looked fine, and the cause was one thing:
every `recipe-ui-kit` custom element was silently failing to render.

`+layout.svelte` registered components through the library's lazy loader,
which bundles all seven into one shared chunk and fetches it via
`import(\`./${bundleId}.entry.js\`)` — a path built from a runtime variable.
Vite's production bundler can't statically analyze that, so it never copied
the file into the build at all. Every component 404'd trying to load its
own implementation; the surrounding Svelte markup kept rendering fine,
which is why the failure looked selective instead of total.

The fix: import each component's `dist-custom-elements` module directly
(`recipe-ui-kit/recipe-ui-card`, and so on) — already part of the published
package, no republish needed. Each one calls `customElements.define()` as
a plain side effect with no computed path in it, so Rollup can bundle it
like any normal module. Verified against the actual build output this
time, not the HTML shell: all seven exist as real chunks, and there's no
`.entry.js` reference left anywhere. The [ADR-008](#adr-008-recipe-ui-kit-excluded-from-vites-dependency-pre-bundler)
workaround goes away with it, since it existed only to paper over this same
loader.

---

## ADR-014: The app is vegetarian-only

Not in the original brief — added on request, and made unconditional
rather than a toggle. TheMealDB has no per-recipe "is this vegetarian"
flag; the only reliable signal is its own category field, which includes
exactly "Vegetarian" and "Vegan." I considered scanning ingredient names
for meat/fish terms instead, to catch recipes that are meat-free but filed
under something like "Dessert" — and rejected it, because keyword matching
against ingredient names is the kind of thing that looks fine in five test
cases and quietly misfires in production. Category membership is
unambiguous, so `isVegetarianCategory()` in
`app/src/lib/validation/diet.ts` is the one definition, checked
independently everywhere rather than filtered once centrally:

- **Discovery** pushes a `filterByCategory` axis for Vegetarian+Vegan on
  every query, unconditionally — the same intersection mechanism as any
  other filter ([ADR-009](#adr-009-discovery--search-intersects-filters-rather-than-overriding-them)),
  just with no chip and no way to turn it off. The old generic category row
  is gone, and the curated ingredient list traded Chicken/Beef/Salmon for
  Paneer/Tofu/Chickpeas.
- **Your own recipes** must have Category set to Vegetarian or Vegan to
  save. This didn't fit `RecipeFormErrors` — a type the library declares,
  with no slot for an app-specific policy — so it's a standalone banner
  the route owns, not a fourth field error.
- **The detail page** is reachable by a direct URL to any TheMealDB id,
  including ones discovery would never surface, so it independently checks
  the loaded recipe and disables Favorite / Add to meal plan if it fails.
- **Favorites and the meal plan** resolve a full recipe on every read, so
  hiding a stale non-vegetarian entry from before this rule existed needed
  no migration — just the same predicate applied before rendering.

One predicate, checked at four points that don't trust each other, rather
than one filter something could route around.
