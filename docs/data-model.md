# Data Model

This is what actually gets stored, in what shape, and what `localStorage`
key it lives under — the three store modules this describes are the ones
covered at a higher level in [architecture.md](./architecture.md#4-state-ownership).
If you're wondering why any of this lives in `localStorage` at all instead
of a real database, that's in
[assumptions.md](./assumptions.md#no-backend).

## Recipe

One `Recipe` type covers both kinds of recipe this app deals with —
TheMealDB ones and the ones a user creates themselves. The `source` field
is what tells them apart, and it's also what gates whether the edit/delete
UI even shows up.

```ts
type Recipe = {
  id: string;                 // MealDB idMeal for source:"api"; uuid for source:"user"
  source: "api" | "user";
  title: string;
  image: string | null;       // remote URL, or null (falls back to a placeholder icon in recipe-ui-card)
  category: string | null;
  area: string | null;        // cuisine/region, MealDB's "strArea" — usually null for user recipes
  ingredients: { name: string; measure: string }[];
  instructions: string;       // freeform text, rendered as-is with line breaks preserved
  tags: string[];
  createdAt: string | null;   // ISO timestamp — null for API recipes, since I don't own that data
  updatedAt: string | null;
};
```

A couple of things worth knowing if you're reading the code around this
type:

- TheMealDB's raw response doesn't look like this at all — it hands back
  `strIngredient1` through `strIngredient20` as flat, mostly-empty fields.
  The API client folds that into the clean `ingredients` array above
  *before* anything else ever sees it, so nothing outside
  `recipe-finder-app/src/lib/api/` has to know that convention exists. Full
  details in [api.md](./api.md#response-normalization).
- Only `source: "user"` recipes ever get handed to `recipe-ui-form` for
  editing, and only those are eligible for delete. API recipes are
  read-only, always.

## Favorites store

`localStorage` key: `recipe-finder:favorites:v1`

```ts
type FavoritesState = {
  ids: Array<{ id: string; source: "api" | "user" }>;
};
```

This one deliberately stores identity only — id and source, nothing else.
No cached title, no cached image. Every time the Favorites page loads, it
resolves each entry back to a real `Recipe` (an API lookup for
`source:"api"`, a store read for `source:"user"`). I went this way
specifically so a favorited recipe can never show stale data — if it had
cached a snapshot at favorite-time, editing that recipe later would leave
the favorites page showing the old version until someone thought to
refresh the cache too.

The cost of that choice is asynchrony, and it's worth naming: rendering the
favorites page means one API lookup per `source:"api"` entry, so the page
resolves over the network rather than instantly from storage. Overlapping
resolves can therefore finish out of order — favorite something while a
previous resolve is still in flight and the older response could land last.
Each resolver holds a **sequence token** and refuses to write if a newer run
has started ([architecture.md §4](./architecture.md#4-state-ownership)).

## User recipes store

`localStorage` key: `recipe-finder:user-recipes:v1`

```ts
type UserRecipesState = {
  recipes: Recipe[]; // all source: "user"
};
```

Before anything here gets created or updated, it has to pass these rules
(and if it doesn't, the form gets the failure back as field-level errors,
via `<recipe-ui-form>`'s `errors` prop):

| Field | Rule |
|---|---|
| `title` | required, 1–120 chars |
| `ingredients` | at least 1 entry; each entry needs a non-empty `name` |
| `instructions` | required, non-empty |
| `image` | optional; no format check beyond that — I didn't add URL validation here, a bad value just renders as a broken image |

## Meal plan store

`localStorage` key: `recipe-finder:meal-plan:v1`

```ts
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type MealPlanState = {
  slots: Record<Weekday, { id: string; source: "api" | "user" } | null>;
};
```

One recipe per day — that's the whole shape. It's the simplest thing that
satisfies "assign recipes to days of the week" without me inventing
multiple-meals-per-day or breakfast/lunch/dinner slots that nothing in the
brief asked for. Same id+source reference pattern as favorites, resolved
to a full `Recipe` only when it's actually rendered.

The shape also means **"modify a planned meal" is not a separate
operation** — `assign(day, ref)` overwrites whatever that day held, so
modifying and assigning are the same write. That's why the filled-slot
*Change* control in `recipe-ui-meal-slot` emits the existing `assign`
event rather than needing a new one, and why the whole day is always
present as a key (`null` when empty) instead of days appearing and
disappearing from the object.

Every day is always present, so `Object.keys(slots)` is invariably the
seven weekdays — code reading the plan never has to handle a missing key.

## Referential integrity

This is the one bit of cross-store logic in the whole app: deleting a
user-created recipe has to also clear it out of `favorites` and
`meal-plan`, in the same operation, or you'd end up with a favorites card
or a meal-plan day pointing at a recipe that no longer exists. I put that
cascade inside `userRecipes`'s own `remove()` method rather than
scattering "also remember to clean up the other two stores" across every
route that might trigger a delete — there's only one place a recipe can
actually get deleted from (the detail page), but even so, I'd rather the
store enforce this than a route remember to.

## Storage versioning

Each `localStorage` key ends in `:v1`. If one of the shapes above ever
needs to change in a way that isn't backward compatible, the plan is to
bump the key to `:v2` and either write a real one-time migration, or —
since this is a graded assignment and nobody's actual data is at stake —
just let it reset clean. Either way, the point is not to silently mutate
what `:v1` readers/writers expect while old data might still be sitting in
someone's browser.
