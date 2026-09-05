# User Guide — doing each task

A walkthrough of the app organised by the assignment's five functional
requirements, so each one can be exercised and checked directly. Setup is
in [getting-started.md](./getting-started.md); start the app with
`npm run dev` and open <http://localhost:5174>.

Nothing needs an account, and no input is required up front — the home page
already has around 25 recipes loaded before you type anything.

---

## 1. Recipe Discovery — search, browse, filter

**Route:** `/` (Discover)

Every result on this page — browse, search, or filtered — is vegetarian or
vegan. That's not a filter you can turn off; it's applied on every query
regardless of anything else you select, so a search for a meat dish
correctly returns nothing rather than showing it anyway.

### Browse

Open the app. The **Browse** grid is already populated. Click any card's
image or title to open its details; click the **heart** in the corner to
favorite it without leaving the grid.

### Search

Type into the search box — for example `paneer`, `pancakes`, `pasta`.
Results update automatically about 300 ms after you stop typing; there is
no Enter to press. The **✕** inside the box clears the search immediately.

### Filter

Two independent filter rows, each multi-select:

| Row | Values | Source |
|---|---|---|
| **Cuisine** | Italian, Thai, Japanese, … | fetched live from TheMealDB |
| **Main ingredient** | 12 vegetarian staples | a curated shortlist ([assumptions.md](./assumptions.md#recipe-data)) |

Click chips to toggle them on and off. A tick appears on active chips.

### Combining search and filters

These compose rather than override one another, which is worth trying
explicitly:

- **Within one row, selections widen the result.** Ingredient = Paneer +
  Tofu means *either*.
- **Across rows, selections narrow it.** Ingredient = Paneer **and**
  Cuisine = Indian means both must hold.
- **A search term narrows further still.** Searching `curry` with
  Cuisine = Indian active gives Indian recipes whose name matches "curry"
  — the search does *not* discard the filter.

**Try this:** type `curry`, then click the **Indian** cuisine chip. The
summary line beneath the filters reads *Searching "curry" within 1
filter*, and the heading changes from **Browse** to **Results**.

Whenever anything is active, a **Clear all** button appears in that summary
line and resets everything back to browse. Clearing never brings back
non-vegetarian recipes — only the cuisine/ingredient filters and the search
term reset; the vegetarian restriction itself has no "off".

If a combination matches nothing you get an explicit empty state — *Nothing
matches all of those at once. Try removing a filter.* — rather than a blank
page.

### Your own recipes

Once you have created any, a **Your Recipes** section appears above Browse,
with **Edit** and **Delete** on each card.

---

## 2. Recipe Details

**Route:** `/recipes/<id>` — reached by clicking any card.

Shows the hero image, category and cuisine badges, **every ingredient with
its measurement**, and the full instructions.

Actions in the header:

| Action | Available for | Effect |
|---|---|---|
| **Add to favorites** / **Favorited** | every recipe | Toggles favorite state |
| **Add to meal plan** / **Planned** | every recipe | Opens the weekday picker (see §5) |
| **Edit** | your own recipes only | Goes to the edit form |
| **Delete** | your own recipes only | Two-step inline confirm |

Recipes from TheMealDB are read-only, so they show no Edit or Delete — this
matches the brief's wording, *"edit recipes created by the user"*.

A bad or removed id shows a **Recipe not found** state with a way back, not
an error page.

---

## 3. Recipe Management — add, edit, delete, validate

### Add a recipe

**Route:** `/recipes/new` — the **Add Recipe** link in the nav.

Fields: **Title** (required), Category, Image URL, **Ingredients**
(name + amount per row, *Add ingredient* for more, ✕ to remove a row), and
**Instructions** (required).

Fill in at least a title, one ingredient name, and instructions, then
**Add recipe**. You land on the new recipe's detail page, and it now
appears in **Your Recipes** on the home page — favoritable and plannable
like any other recipe.

### Check the validation

Validation is layered, and both layers are worth seeing:

| What you do | What stops you |
|---|---|
| Submit with an empty Title or Instructions | The browser's own `required` — the field is focused, nothing submits |
| Enter only spaces in Title, then submit | App validation: *Title is required.* |
| Enter a Title longer than 120 characters | *Title must be 120 characters or fewer.* |
| Remove every ingredient row (or leave every name blank, amounts only) | *Add at least one ingredient.* |
| Enter only spaces in Instructions | *Instructions are required.* |
| Category is anything other than "Vegetarian" or "Vegan" | *This app only accepts vegetarian recipes.* |

Errors render beneath the offending field, and **all failing fields report
at once** rather than one at a time. Your typing is preserved — the form
does not reset when validation fails.

The Category check is why: this app never shows a non-vegetarian recipe
anywhere, including ones you add yourself. It shows as a banner above the
form rather than beneath the Category field, since it's an app-wide rule
rather than a per-field one.

Amount-without-a-name rows are dropped silently on save; a name with no
amount is kept.

### Edit a recipe

**Route:** `/recipes/<id>/edit` — via **Edit** on the detail page, or on
the card in **Your Recipes**.

The form opens pre-filled. Change anything and **Save changes**; you return
to the detail page. The same validation rules apply. Opening this route for
an API recipe (or a deleted one) shows *Can't edit this recipe*.

### Delete a recipe

From the detail page or the card footer. Both are two-step: **Delete** then
**Confirm** (**Cancel** backs out). Deliberately an inline confirm rather
than a native `window.confirm()` dialog.

Deleting also cleans up after itself: the recipe is removed from your
favorites **and** from any meal-plan day it occupied, in the same
operation. Worth verifying — favorite a recipe you created, assign it to
Monday, then delete it, and check both `/favorites` and `/meal-plan`.

---

## 4. Favorites

**Route:** `/favorites`

Add a favorite from a card's heart or the detail page. Remove it by
clicking the heart again anywhere — including on the favorites page itself,
where the card disappears immediately.

Favorites store **identity only**, never a snapshot. So if you favorite one
of your own recipes and later rename it, the favorites page shows the new
name — there is no stale cached copy
([data-model.md](./data-model.md#favorites-store)).

Empty state offers a route back to discovery.

---

## 5. Weekly Meal Planner

**Route:** `/meal-plan`

Seven day slots, Monday to Sunday, one recipe each.

### Assign a recipe to a day

Two ways in:

1. **From the plan** — click an empty day. A picker opens with your
   favorites and your own recipes; click one to fill the slot.
2. **From any recipe** — on a recipe's detail page click **Add to meal
   plan** and choose a day. This is how a recipe you just found by browsing
   gets planned without favoriting it first.

### Modify a planned meal

Hover a filled slot and click it — a **Change** hint appears on the recipe
area. That reopens the picker for that day, and choosing a different recipe
**replaces** the existing one in place.

You can also do it from the detail page: days already holding something are
marked **Replace**, and the day holding this very recipe is marked **This
recipe**.

### Remove a planned meal

Click the **✕** on a filled slot. The day returns to *Add recipe*.

The same recipe can occupy several days. If the picker is empty, it tells
you to favorite a recipe or add your own first.

---

## What persists, and what does not

Everything you save — favorites, your recipes, the meal plan — is stored in
your **browser's** `localStorage`. It survives refreshes and restarts, but:

- it is per-browser and per-device, with no sync;
- a different browser, or a private window, starts empty;
- clearing site data wipes it.

That is a deliberate scope decision, not an oversight — see
[assumptions.md](./assumptions.md#no-backend).

## Other things you may notice

- **Dark mode** follows your OS setting automatically.
- **Loading** shows shimmer skeleton cards rather than a spinner or "Loading…".
- **API trouble** shows *Could not reach the recipe API* with a **Try
  again** button, instead of an empty grid.
- **Keyboard** — cards are focusable and activate with Enter or Space; the
  modal closes on Escape or a backdrop click.
