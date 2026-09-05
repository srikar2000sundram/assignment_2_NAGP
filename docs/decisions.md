# Decisions Log

Every non-obvious call I made on this project, in the order I made them, with
the problem that forced each one and why I landed where I did. Where I looked
at other options and passed, I've said so. If you want to know *what* got
built, [architecture.md](./architecture.md) is the file you want. This one is
just the reasoning trail.

---

## ADR-001: Project layout — two sibling projects, one repository

**Originally decided as two separate git repositories; superseded at
submission time — see the amendment at the end of this entry. The two
projects remain independent (separate `package.json`, separate
`node_modules`, no workspace); only the repository count changed.**

The assignment wants two deliverables that depend on each other, a Stencil
component library and a SvelteKit app that consumes it. The natural instinct
is to wire them into an npm workspace so you can iterate on both without
constantly rebuilding and reinstalling. I didn't do that, on purpose.

The requirement isn't "the app uses the library", it's "the app consumes the
*published* library". A workspace makes that far too easy to cheat on by
accident. You link the local source, everything works, and you never find out
that some export you're relying on wouldn't have survived being packaged. So
I kept `recipe-ui-kit/` and `recipe-finder-app/` as independent folders with
their own `package.json` and `node_modules`, no workspace protocol between
them.

The cost is that until the library is actually published, the app can't just
`npm install @srikar_sundram/recipe-ui-kit` and work. I got around that with
`npm pack` and a local tarball rather than a workspace link or `npm link`.
More on that in ADR-004, which is really the same problem seen from the other
side.

### Amendment — one repository, not two

In the end I shipped this as one repository,
[assignment_2_NAGP](https://github.com/srikar2000sundram/assignment_2_NAGP),
with both projects inside it. Two things changed my mind.

The first was re-reading the deliverables list. It asks for the app's source,
the library's source, and a "Link to **github repository**". Singular. Two
repos would mean handing over a second link nobody asked for, and scattering
one submission across two places for a reviewer to hunt down. My original
reasoning was about development hygiene, which is a fine thing to care about
but isn't what the deliverable is.

The second reason matters more. The thing I was guarding against, quietly
consuming the library from source, is already prevented by something
stronger than folder layout. The app depends on
`"@srikar_sundram/recipe-ui-kit": "^0.2.0"` and `package-lock.json` resolves
that from `registry.npmjs.org`. All it can see is `dist/`, `loader/` and
whatever the `exports` map allows. The `recipe-ui-kit/src` sitting one
directory away might as well not exist as far as the app is concerned.
Sharing a repo doesn't change any of that, and a checked-in lockfile is a
much better guarantee than physical separation ever was, because you can
actually verify it.

What I lost: the library no longer has its own git history (those four
commits got folded in when it became a subdirectory) and you can't clone it
on its own. Neither matters here. It's on npm, so consumers install it rather
than clone it, and its releases are tracked in
[CHANGELOG.md](../recipe-ui-kit/CHANGELOG.md).

One thing to keep straight, though: the two projects still have separate
`package.json` files and separate `node_modules`. This is **not** an npm
workspace, and that's deliberate. Hoisting and linking the library locally is
exactly what would bring back the failure mode the original decision existed
to prevent.

---

## ADR-002: Recipe data source — TheMealDB

I needed a real public recipe API for search, browse, filter and detail, and
looked at three: TheMealDB, Spoonacular and Edamam.

Spoonacular has much better data (nutrition, diet tags, the works) but it's
metered on a low free-tier daily quota. I didn't want someone reviewing this
to hit a 402 halfway through because I'd already burned the day's calls
testing. Edamam needs two separate secrets, an App ID *and* an App Key, plus
stricter attribution rules. That's more setup friction in a grading
environment for no functional gain here.

TheMealDB won mostly by staying out of the way. Shared free test key (just
the literal `1` in the URL path), no signup, no auth headers, and it covers
everything Recipe Discovery asks for: name search, category/area/ingredient
filtering, and full detail lookup by id. Anyone cloning this can run it
immediately with no API-key setup at all, which I cared about a lot given
someone else has to run this cold.

One consequence worth flagging, because it shaped the data model: TheMealDB
recipes are read-only. So "add/edit/delete" (the Recipe Management
requirement) had to become a *separate* kind of recipe that the app owns
itself, rather than something layered on top of API data. That split is in
[data-model.md](./data-model.md); the endpoints I actually used are in
[api.md](./api.md).

---

## ADR-003: Package manager — npm

Not much of a debate. I used npm for both projects rather than pnpm or yarn,
mainly because the brief keeps saying "npm package" and "npm Publishing
Requirement". Using something else would mean mentally translating those
instructions every time, and it'd be one more thing to install beyond what
ships with Node. Not a hard requirement, just the path of least surprise.

---

## ADR-004: Published package name

**Originally decided as unscoped `recipe-ui-kit`; superseded at publish
time — see the amendment at the end of this entry.**

Before putting the name anywhere (configs, docs, install instructions) I
checked it was actually free: `npm view recipe-ui-kit` came back 404. So I
went with it unscoped rather than under a personal npm scope. An unscoped
name reads better in install instructions than `@someone/recipe-ui-kit`, and
it doesn't tie the deliverable to whoever's account happens to publish first.

The harder problem underneath this: I need the app to consume the package
like a real dependency, but I can't publish until it's finished, and I don't
want to cut a new version every time I tweak a component. My answer was
`npm pack`. Build the library, pack it into a real `.tgz`, and install that
into the app rather than using a `file:` source link or `npm link`. The
distinction matters, because a tarball install only exposes what the package
actually publishes: compiled `dist/`, the `loader/`, whatever's in `exports`.
Not the raw `.ts` source. So the app is forced to work against the same
surface a real consumer sees. Once it's published, swapping the tarball path
for a version range is a one-line change.

Versioning follows plain semver from `0.1.0`. The bump policy lives in
[architecture.md](./architecture.md#7-versioning) so I don't have to
re-decide it every time a contract changes.

### Amendment — the unscoped name was taken before I published

All of that held right up until it didn't. When I came to publish,
`npm view recipe-ui-kit` returned `1.0.1` instead of a 404. Someone had
registered the name on 2026-08-28, in the gap between my availability check
and my publish. `npm publish` would have 403'd, and fairly so. It wasn't my
name to take.

So it ships as `@srikar_sundram/recipe-ui-kit`, scoped to my account. Other
unscoped names were still free (`recipe-finder-ui-kit`,
`recipe-planner-ui-kit`) and I passed on all of them for precisely the reason
I got burned: an unscoped name is a claim on a shared global namespace, and
"free today" tells you nothing about tomorrow. Nobody can take a scoped name
out from under me.

The rename wasn't free. Package names show up in module specifiers, so it
touched the dependency entry, ten import sites in the app,
`optimizeDeps.exclude` in `vite.config.ts`, and install instructions all
through these docs. That's the real cost of the original decision, and it's
why "reads cleaner in install instructions" was too thin an argument to carry
the choice by itself. Scope by default unless you're deliberately claiming a
public name; the cosmetics of `@user/pkg` versus `pkg` aren't worth losing a
namespace race over.

Nothing architectural moved. The consumption mechanism, the
tarball-versus-registry story above, every prop and event contract: all
identical. Only the string naming the package changed. The directory is still
`recipe-ui-kit/` and the tags are still `<recipe-ui-card>` and friends, since
Stencil takes tag names from the components rather than the package.

---

## ADR-005: State & persistence — no backend, browser storage only

Favorites, user-created recipes and the weekly meal plan all have to persist
somewhere. The obvious "proper" answer is a backend with a database, and I
sat with that for a while before deciding against it, because nothing in the
assignment asks for one. The brief is scoped around component architecture,
state management, routing and the SvelteKit/Stencil integration. Not
multi-user accounts, not cross-device sync. Building a backend anyway would
have meant hosting, a database, probably auth, and none of it would
demonstrate anything the grading criteria are looking for.

So it all lives in `localStorage`, behind three small runes-based store
modules. Much simpler to run (clone, install, `npm run dev`, no `.env`, no
database to seed) and it satisfies every functional requirement as written,
since none of them say the data has to follow you between devices.

The trade-off is real, and the README says so plainly: this is per-browser
data. Clear your site storage or open a different browser and it's gone.
Better to write that down than gloss over it.

---

## ADR-006: Component boundary between Stencil and Svelte

Once both projects were scaffolded I needed a firm rule for what belongs in
the library versus the app, or components would creep toward doing too much
and stop being reusable.

The line: Stencil owns things that are purely presentational and
framework-agnostic. A recipe card, the rating chips, a day-of-week meal slot,
the modal shell, a debounced search input. SvelteKit owns anything with app
logic behind it: routing, fetching, business state. Components take data
through props and report what happened through `CustomEvent`s. They never
reach into a Svelte store or call `fetch` themselves. The moment a "reusable"
component quietly depends on this app's store shape, it isn't a portable web
component any more, it just looks like one.

This is also more or less what the Integration Requirement describes (props
in, events out, slots where they make sense), so following it strictly wasn't
extra work. It's the shape you end up with anyway once you take the
requirement seriously.

The upkeep cost: there's a full prop/event/slot table per component in
[architecture.md](./architecture.md#component-contracts), and whenever I
rename something on the Stencil side I have to remember to update the table
too, not just the component. That came up for real when I had to dodge native
DOM name collisions (`recipeTitle` not `title`, `formSubmit` not `submit`,
`filterChange` not `selectionchange`).

---

## ADR-007: Theming through inherited CSS custom properties

Once both sides had styling I had to decide how a shadow-DOM component
library gets themed by its host. Shadow DOM blocks outside stylesheets by
design, so the obvious routes were: a `theme` prop on every component with an
object drilled through the tree, a stylesheet consumers import and override,
or `::part()` so consumers can style internals directly.

I used none of them. Every colour, radius, shadow and font is a `--ruik-*`
custom property, defined once on `:root` in the app's `app.css`. Each Stencil
component reads it as `var(--ruik-color-primary, <fallback>)` instead of
setting its own value on `:host`.

That works because custom properties are one of the few things that inherit
straight through shadow boundaries. So the host themes the entire library
from one place with no API surface at all: no theme prop, no stylesheet to
import, no `::part()` contract to keep stable. The per-component fallback
earns its keep too, since it keeps each component looking deliberate in its
own dev preview where the app's `:root` block doesn't exist.

Dark mode is where this paid off. It turned out to be a second block of the
same variable names under `@media (prefers-color-scheme: dark)` and zero
changes in any component, because components only ever read tokens, never
define them.

The catch is that token names are now an implicit contract. Rename
`--ruik-color-primary` and seven components quietly fall back to their
defaults instead of failing loudly. I took that trade to avoid having a
theming API to version.

---

## ADR-008: `recipe-ui-kit` excluded from Vite's dependency pre-bundler

Less a design choice than a bug I had to work around, but worth writing down
because it'll bite again if the fix ever gets removed.

After rebuilding and repacking the library a few times, the dev server
started 404ing on files like `recipe-ui-card_6.entry.js`, with Vite's own
error pointing at the fix: "Try adding it to `optimizeDeps.exclude`". What's
going on is that `@srikar_sundram/recipe-ui-kit/loader` does its own runtime
`import()` of per-component lazy chunks, which is the whole point of
Stencil's lazy-loading model. Vite's dependency scanner tries to follow those
dynamic imports and pre-bundle them, caching what it finds in
`node_modules/.vite/deps` keyed by filename. Stencil content-hashes those
filenames, so every rebuild changes them, but a tarball reinstall doesn't
bump a version number, so Vite has no idea anything changed and keeps serving
its stale cache.

The fix is one line in `vite.config.ts`:
`optimizeDeps.exclude: ['@srikar_sundram/recipe-ui-kit', '@srikar_sundram/recipe-ui-kit/loader']`.
That's safe specifically because the package is only ever imported lazily,
inside `onMount`, in the browser. It never needed to be in Vite's eager
module graph.

In practice: if you rebuild and repack while the dev server is running you
still have to restart it or clear `node_modules/.vite/`. Excluding it stopped
the 404s, it didn't make Vite psychic about a tarball changing underneath it.

---

## ADR-009: Discovery — search intersects filters rather than overriding them

The first version of the discovery page treated the search box as a mode
switch. Text in the box meant run `search.php` and ignore the chips;
otherwise run `filter.php` for whatever was selected. I built it that way
because TheMealDB's two endpoint families really are separate: different
parameters, different response shapes, and combining them means doing the
work client-side.

It was wrong, and it became obvious the moment I used the app as a user
rather than its author. You pick "Japanese", scroll a bit, type "chicken" to
narrow things down, and your cuisine filter silently disappears with nothing
in the UI to tell you. "Search *or* filter" is a defensible reading of the
brief. "Search *within* my filters" is what anyone actually expects from a
search box sitting above a row of chips.

So search stopped being special and became one more constraint. The rules all
live in `app/src/lib/search/compose.ts`:

- within an axis, selections union (Chicken + Dessert means either, since a
  recipe that's both basically never exists);
- across axes, results intersect (Chicken + Japanese means both);
- a search term is just another axis, so it intersects too.

Two things made this worth doing properly rather than hacking. The result
sets are small, a few hundred records at worst, so a client-side intersection
costs nothing measurable. More importantly, I pulled the whole thing out into
a pure module with no fetching in it. The route decides which calls to make;
`compose.ts` decides what the combined answer is. That's what made 21 tests
over the set algebra possible with no browser and no network, and the edge
cases turned out to be exactly where bugs would have hidden. An empty search
result (`[]`) means something completely different from no search at all
(`null`), and an active axis that matched nothing has to empty the result
while an *omitted* axis means "unconstrained".

One wrinkle needed explicit handling. `filter.php` returns bare summaries
with no category; `search.php` returns full detail. Intersecting naively
would have stripped the category badge off every card the moment a filter was
involved, so `mergePreferDetail()` upgrades a summary to the detailed record
when both turn up for the same id, and never downgrades.

---

## ADR-010: Curated ingredient filter options

Adding a main-ingredient filter meant deciding where the options come from.
`list.php?i=list` returns TheMealDB's full ingredient list and my first
instinct was to use it, the same way the category and cuisine rows use
`list.php?c=list` and `list.php?a=list`.

That list has around 600 entries. As a chip row it would run several screens
tall, dwarfing the recipes it's meant to filter, and most entries match one
or two recipes, so nearly all of it would be dead weight. Categories (14) and
areas (~29) work fine as exhaustive rows. Ingredients don't.

I considered a searchable combobox and a "show more" disclosure. Both are
more component than this needs, and the combobox especially would have meant
a new Stencil component with real keyboard-interaction complexity. That's a
lot of surface area for one filter axis on an assignment about integration.

So `app/src/lib/search/ingredients.ts` holds a hand-picked list of 12 common
staples. The values have to match TheMealDB's spelling exactly because they
go straight into `filter.php?i=`, which is the fragile part and the reason
the constant carries a comment saying so. If this ever needs to be
exhaustive, the answer is a searchable input, not 600 chips.

---

## ADR-011: `adapter-static`, not `adapter-vercel`

I'd settled on Vercel and installed `@sveltejs/adapter-vercel`. Then
`npm run build` died on Windows with `EPERM: symlink`, because the adapter
creates a symlink inside `.vercel/output/functions` and Windows won't allow
that without Developer Mode or an elevated shell.

Vercel's own Linux builders would have been fine, so I could have shrugged
and left it to CI. But a project whose production build won't run locally for
whoever's grading it isn't acceptable, so I went and looked at what this app
actually needs from an adapter.

Nothing, as it turns out. No `+page.server.ts`, no `+layout.server.ts`, no
`load` functions anywhere, no `hooks.server.ts`. Every byte of data comes
from TheMealDB (fetched in the browser) or `localStorage`. There's no
serverless function to deploy because there's no server-side code to put in
one, which follows directly from
[ADR-005](#adr-005-state--persistence--no-backend-browser-storage-only).

So `@sveltejs/adapter-static` isn't a workaround here, it's just an accurate
description of what this is. It builds on any OS, deploys to Vercel with no
extra configuration since Vercel serves static output natively, and would
work equally well on Netlify, Cloudflare Pages or GitHub Pages if the target
changes.

Three details it forced:

- `/recipes/[id]` and its `edit` child can't be prerendered, since the ids
  come from TheMealDB or the user's own storage and aren't knowable at build
  time. Both have a `+page.ts` with `prerender = false` and get served by the
  static adapter's fallback page for client-side rendering. Everything else
  prerenders via `prerender = true` in `+layout.ts`.
- The fallback is `200.html` rather than `index.html`, because `/` already
  prerenders to `index.html` and the adapter warned it was about to overwrite
  it. `vercel.json` rewrites unmatched paths to `/200.html`. Filesystem
  matches win first on Vercel, so prerendered routes still serve directly.
- Vercel's framework auto-detection expects a `svelte.config.js` at the
  project root to recognise a SvelteKit project, and this project doesn't
  have one (the adapter is wired up inside `vite.config.ts` instead). Without
  that file Vercel fell back to treating the project as generic Vite, whose
  default output folder is `dist`, and the first deploy failed with
  "No Output Directory named dist found" even though the build had already
  written everything to `build/` correctly. `vercel.json` now pins
  `"outputDirectory": "build"` explicitly rather than relying on Vercel's
  guess.

---

## ADR-012: Where validation lives, and why there are two layers

This follows from
[ADR-006](#adr-006-component-boundary-between-stencil-and-svelte) but it
earns its own entry, because "the form validates itself" is the obvious
design and I deliberately didn't do it.

`<recipe-ui-form>` has no business validation in it. Title and Instructions
are marked `required` for baseline browser UX and that's the extent of it.
The actual rules, what makes a recipe valid, live in
`app/src/lib/validation/recipe.ts`, and the app hands failures back to the
component through its `errors` prop.

The reason is reusability. A 120-character title limit, or the rule that at
least one ingredient must be named, are facts about *this app's data model*,
not about recipe forms in general. Bake them into the component and the next
consumer inherits this app's business rules whether they want them or not,
with no way to override. Props in, events out, host owns the rules. Same
boundary as everywhere else.

What I didn't expect is how useful the resulting two layers turned out to be,
rather than redundant. The browser's `required` catches a genuinely empty
field instantly, no round trip and no JavaScript. But `required` is perfectly
happy with `"   "`, because three spaces is a non-empty value as far as HTML
cares. So the app layer is what catches whitespace-only input, the character
limit, and an ingredient list where every row has a measure but no name. The
seam between the two is where the interesting test cases live, and
[testing.md](./testing.md) calls it out explicitly.
