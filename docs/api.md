# API Reference — TheMealDB

Everything the app actually calls lives in
`recipe-finder-app/src/lib/api/mealdb.ts`, and this doc is basically the
notes I kept while wiring it up — I checked every endpoint below against
https://www.themealdb.com/api.php myself rather than assuming, and a
couple of the quirks further down aren't in TheMealDB's own docs at all,
just things I ran into. Why TheMealDB specifically:
[decisions.md — ADR-002](./decisions.md#adr-002-recipe-data-source--themealdb).

**Base URL:** `https://www.themealdb.com/api/json/v1/1/`
The trailing `1` is the shared free test key baked right into the path —
no signup, no auth header, nothing to put in a `.env` file. It's just a
`const BASE_URL` at the top of `mealdb.ts`; if this ever needs to move to
a real paid key, that's a one-line edit in that file, not a config system
I built out in advance for a need that doesn't exist yet.

## Endpoints used

| Purpose | Endpoint | Used from |
|---|---|---|
| Search by name | `search.php?s=<query>` | `/` search bar (`recipe-ui-search-bar` → `searchChange`) |
| Filter by category | `filter.php?c=<category>` | `/` filter chips (category row) |
| Filter by area (cuisine) | `filter.php?a=<area>` | `/` filter chips (area row) |
| Filter by main ingredient | `filter.php?i=<ingredient>` | `/` filter chips (main-ingredient row, curated options — [ADR-010](./decisions.md#adr-010-curated-ingredient-filter-options)) |
| List all categories | `list.php?c=list` | populates the category filter chip options |
| List all areas | `list.php?a=list` | populates the area filter chip options |
| Full detail lookup | `lookup.php?i=<id>` | `/recipes/[id]` |
| Random meal | `random.php` | client exposes `randomRecipe`, not currently used by any route |

`randomRecipe` is the one export nothing calls yet — it was easy to add
alongside the others while I had the response shape fresh in my head, and
it's the obvious next thing if a "surprise me" button ever gets added. It
is tested regardless, so it can't rot silently.

Note that the ingredient row does **not** use `list.php?i=list` to populate
its options, even though the category and cuisine rows use their
equivalents: that endpoint returns roughly 600 ingredients, which is
unusable as a chip row. The options are a curated constant instead —
[ADR-010](./decisions.md#adr-010-curated-ingredient-filter-options).

Didn't bother with: `search.php?f=<letter>` (redundant with name search for
what this app needs), `randomselection.php` / `latest.php` (premium-only),
multi-ingredient `filter.php?i=a,b,c` (premium-only, V2 endpoint).

## Response normalization

`filter.php`/`search.php` and `lookup.php` don't hand back the same shape,
which tripped me up the first time I wired the discovery grid to a detail
page and wondered why "ingredients" was just missing:

- `filter.php?...` → `{ meals: [{ strMeal, strMealThumb, idMeal }] }` —
  **summary only**, no ingredients or instructions at all. Fine for a grid,
  useless for a detail page.
- `search.php?s=...` and `lookup.php?i=...` → full detail, but ingredients
  come back as 20 separate, mostly-empty fields
  (`strIngredient1`…`strIngredient20` paired with `strMeasure1`…`strMeasure20`)
  instead of an array.

The client normalizes both shapes into this app's own `Recipe` type (see
[data-model.md](./data-model.md#recipe)) right at the boundary — nothing
outside `src/lib/api/` ever has to touch a raw `strIngredient7`-style
field. The ingredient-folding logic is just: walk `strIngredient1..20`,
skip any that are empty/null, and zip whatever's left with the matching
`strMeasure<n>`.

Two things I only found by actually calling the API, not by reading docs:

- **Zero results comes back as `{ meals: null }`, not `{ meals: [] }`.**
  I checked for falsy/empty-array first and got a "recipe not found"
  crash on a legitimate no-results search before I caught this — the
  client has to check for `null` explicitly.
- **An empty `search.php?s=` isn't a zero-result search.** I tried it on a
  whim while looking for a way to power the discovery page's default
  "browse everything" view, and it actually comes back with a real set of
  roughly 25 meals across categories. That became the default view before
  a user types or filters anything — otherwise I'd have needed some other
  "list everything" endpoint, which TheMealDB doesn't expose on the free
  tier.

## How many requests one query makes

Discovery composes several axes ([ADR-009](./decisions.md#adr-009-discovery--search-intersects-filters-rather-than-overriding-them)),
and each *selection* is its own request, since the free tier has no
multi-value filter endpoint. So a query with a search term plus two
categories plus one cuisine is 1 + 2 + 1 = **four** parallel requests,
intersected client-side.

That is fine at this scale — every axis fires in parallel via
`Promise.all`, and the result sets are a few hundred records at most — but
it is worth knowing before adding a fourth or fifth filter axis. Two things
keep it honest: axes with no selection are never fetched at all, and the
default browse call is skipped entirely once anything else is active.

Every query also carries a **sequence token**. Responses can arrive out of
order (a slow first request landing after a fast second one), so a run that
is no longer current discards its own results rather than overwriting newer
ones.

## Rate limits / reliability caveats

- There's no published hard rate limit on the shared test key, but it's
  the same key every TheMealDB tutorial and demo on the internet uses, so
  I built in the assumption that it can be slow or flaky sometimes. The
  client wraps every call in a try/catch; if something fails, the route
  shows an actual error message instead of crashing — there's no retry
  button, just try searching or filtering again.
- No CORS problems — TheMealDB sets permissive headers, so every call goes
  straight from the browser, no proxy route needed on my side.
- Images (`strMealThumb`) are hotlinked straight from TheMealDB's CDN. I'm
  not downloading or re-hosting them anywhere.
