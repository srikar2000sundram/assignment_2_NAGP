# Decisions Log

Every non-obvious call I made on this project, in the order I made them,
with the actual problem that forced the decision and why I landed where I
landed — including the options I looked at and passed on. If you're trying
to understand *what* got built, read [architecture.md](./architecture.md)
instead; this file is just
the reasoning trail, kept up to date whenever I make a call that isn't
obvious from reading the code.

---

## ADR-001: Project layout — two sibling projects, one repository

**Originally decided as two separate git repositories; superseded at
submission time — see the amendment at the end of this entry. The two
projects remain independent (separate `package.json`, separate
`node_modules`, no workspace); only the repository count changed.**

The assignment wants two deliverables that depend on each other — a Stencil
component library and a SvelteKit app that consumes it — and the natural
instinct is to wire them up as an npm/pnpm workspace so you can iterate on
both at once without constantly rebuilding and reinstalling. I didn't do
that, on purpose.

The requirement isn't just "the app uses the library," it's "the app
consumes the *published* library." A workspace makes that too easy to
cheat on by accident — you link the local source, everything works, and
you never actually notice if something you're using wouldn't have survived
being published (wrong export, missing type, whatever). So I kept
`recipe-ui-kit/` and `recipe-finder-app/` as two completely independent
folders, each with its own `package.json` and `node_modules`, no workspace
protocol between them. It also just matches how the deliverables are
described — two separate source trees plus a published package link — so
independent projects map onto that 1:1 instead of me having to explain why
one repo produces two deliverables.

The cost of this is that until `recipe-ui-kit` is actually published, the
app can't just `npm install @srikar_sundram/recipe-ui-kit` and have it
work. I solved that
with a `npm pack` + local tarball install instead of a workspace link or
`npm link` — more on that under ADR-004, since it's really the same
problem from the other side.


### Amendment — one repository, not two

I shipped this as a **single repository**
([assignment_2_NAGP](https://github.com/srikar2000sundram/assignment_2_NAGP))
containing both projects, which reverses the decision above. Two things
changed my mind.

First, I re-read the deliverables. They ask for source code for the app,
source code for the library, and a "Link to **github repository**" —
singular. Two repos would mean handing over a second link the brief never
asks for, and splitting one submission across two places for a reviewer to
find. The original reasoning above was about *my* development hygiene; it
was never about what the deliverable actually is.

Second, and more importantly, the goal that motivated the split is already
met by other means. The worry was that co-locating the projects makes it too
easy to accidentally consume the library from source and never notice.
That's a real failure mode — but the thing that actually prevents it is the
dependency itself, not the directory layout. `recipe-finder-app` depends on
`"@srikar_sundram/recipe-ui-kit": "^0.2.0"`, and `package-lock.json`
resolves it from `registry.npmjs.org`. It can only see `dist/`, `loader/`
and whatever the `exports` map allows — the `recipe-ui-kit/src` sitting one
directory away is invisible to it. Nothing about sharing a repo weakens
that, and the lockfile is a far stronger guarantee than physical separation
ever was, because it's checked in and verifiable.

What I gave up: the library no longer has independent git history (its four
commits were folded in when it became a subdirectory), and it can't be
cloned on its own. Neither costs anything here — it's published to npm, so
consumers install it from the registry rather than cloning it, and its
releases are tracked in [CHANGELOG.md](../recipe-ui-kit/CHANGELOG.md) rather
than in a separate commit log.

The one thing to keep straight in a single repo: the two projects still have
**separate `package.json` files and separate `node_modules`**. This is not
an npm workspace, and deliberately so — a workspace would hoist and link the
library locally, which *would* reintroduce exactly the failure mode the
original decision was guarding against.

---

## ADR-002: Recipe data source — TheMealDB

I needed a real, public recipe API for search/browse/filter/detail, and I
looked at three: TheMealDB, Spoonacular, and Edamam.

Spoonacular has genuinely better data — nutrition info, diet tags, the
works — but it's metered on a low free-tier daily quota, and I didn't want
to risk someone reviewing this hitting a 402 partway through because I'd
already burned the day's free calls testing it myself. Edamam needs two
separate secrets (an App ID *and* an App Key) plus stricter attribution
rules, which is just more setup friction for a grading environment for no
real functional upside here.

TheMealDB won mostly by not getting in the way: it has a shared free test
key (just the literal `1` in the URL path), no signup, no auth headers,
and it covers everything Recipe Discovery actually asks for — name search,
category/area/ingredient filtering, and a full detail lookup by id. Anyone
cloning this repo can run it immediately with zero API-key setup, which
mattered a lot to me given this needs to be easy for someone else to run
cold.

One thing this decision pushed downstream: since TheMealDB recipes are
read-only, "add/edit/delete" (the Recipe Management requirement) had to be
modeled as a *separate* kind of recipe the app owns itself, not something
layered on top of the API data. That split is documented in
[data-model.md](./data-model.md), and the exact endpoints I ended up using
are in [api.md](./api.md).

---

## ADR-003: Package manager — npm

Not much of a debate here — I used npm for both projects instead of pnpm
or yarn, mainly because the assignment brief itself keeps saying "npm
package" and "npm Publishing Requirement." Using anything else would mean
translating those instructions in my head every time, and it'd be one more
thing someone running this has to have installed beyond what ships with
Node. Not a hard requirement, just the path of least surprise.

---

## ADR-004: Published package name

**Originally decided as unscoped `recipe-ui-kit`; superseded at publish
time — see the amendment at the end of this entry.**

Before I put the name anywhere — configs, docs, install instructions — I
checked whether it was actually free on the registry:
`npm view recipe-ui-kit` came back 404, so it was available, and I went
with it unscoped rather than under a personal npm username scope. An
unscoped name reads cleaner in install instructions than
`@someone/recipe-ui-kit`, and it doesn't tie the deliverable to whoever's
npm account happens to publish it first.

The harder problem this decision runs into: I need the app to *consume*
this package like a real published dependency, but I can't publish it
until it's actually finished, and I don't want to be re-publishing a new
version every time I tweak a component during development. My answer was
`npm pack` — build the library, pack it into a real `.tgz` tarball, and
install *that* into the app (`npm install ../recipe-ui-kit/recipe-ui-kit-0.1.0.tgz`)
instead of a `file:` source link or `npm link`. The difference matters:
a tarball install only exposes what the package actually publishes —
compiled `dist/`, the `loader/`, whatever's in its `exports` map — not the
raw `.ts` source. So the app is forced to work against the same surface a
real published-package consumer would see. Once I actually run
`npm publish`, the fix is a one-line change: swap the tarball path for a
version range and drop the pack step.

Versioning from here follows plain semver starting at `0.1.0` — the bump
policy is written out in [architecture.md](./architecture.md#7-versioning)
so I don't have to re-decide it every time a component's contract changes.


### Amendment — the unscoped name was taken before I published

The reasoning above held right up until it didn't. When I actually came to
publish, `npm view recipe-ui-kit` returned **1.0.1**, not a 404: someone
else had created a package under that name on 2026-08-28, in the window
between my availability check and my publish. `npm publish` would have
failed with a 403, and rightly so — it wasn't my name to take.

So the library publishes as **`@srikar_sundram/recipe-ui-kit`**, scoped to
my npm account. The alternatives were other unscoped names that happened to
still be free (`recipe-finder-ui-kit`, `recipe-planner-ui-kit`), and I
passed on them for the same reason this problem happened in the first
place: an unscoped name is a global claim on a shared namespace, and being
free *today* is not a property you can rely on tomorrow. A scoped name
cannot be taken by anyone else, ever.

What this cost, concretely: the package name appears in module specifiers,
so the rename touched the dependency entry, ten import sites in the app,
`optimizeDeps.exclude` in `vite.config.ts`, and the install instructions
throughout these docs. That is the honest price of the original decision —
and it is exactly why the "reads cleaner in install instructions" argument
above was too thin to carry the choice on its own. Scoped is the right
default for anything that isn't a deliberately-claimed public name, and the
cosmetics of `@user/pkg` versus `pkg` are not worth a namespace race.

What did **not** change is anything architectural. The consumption
mechanism, the tarball-versus-registry story below, and every prop/event
contract are identical; only the string that names the package moved. The
directory is still `recipe-ui-kit/`, and the custom-element tags are still
`<recipe-ui-card>` and friends — Stencil's tag names come from the
components, not from the package name.

---

## ADR-005: State & persistence — no backend, browser storage only

Favorites, the recipes a user creates, and the weekly meal plan all need
to persist somewhere. The obvious "proper" answer is a backend with a
database, but I sat with that for a bit and decided against it, because
nothing in the actual assignment asks for one. The brief is scoped around
component architecture, state management, routing, and the SvelteKit↔Stencil
integration — not multi-user accounts or data syncing across devices.
Building a backend anyway would've meant standing up hosting, a database,
probably some auth, and none of that would have demonstrated anything the
grading criteria are actually looking for.

So everything lives in the browser's `localStorage`, behind three small
Svelte 5 runes-based store modules. It's genuinely simpler to run (clone,
install, `npm run dev`, done — no `.env`, no database to seed) and it
still satisfies every functional requirement as written, since none of
them specify the data has to follow you between devices.

The trade-off is real and I say so plainly in the top-level README: this
is per-browser data. Clear your site storage, or open the app in a
different browser, and it's gone. That felt like an honest trade to write
down rather than something to gloss over.

---

## ADR-006: Component boundary between Stencil and Svelte

Once I had both projects scaffolded, I needed a firm rule for what goes in
the Stencil library versus what stays in the SvelteKit app, otherwise
components creep toward doing too much and stop being reusable.

The line I drew: Stencil owns things that are purely presentational and
framework-agnostic — a recipe card, the rating chips, a day-of-week meal
slot, the modal shell, a debounced search input. SvelteKit owns
everything with actual app logic behind it — routing, fetching, business
state. A Stencil component gets data through props and tells the app what
happened through `CustomEvent`s; it never reaches into a Svelte store or
calls `fetch` on its own. The moment a "reusable" component quietly
depends on this one app's store shape, it isn't really a portable web
component anymore — it just looks like one.

This is also just what the Integration Requirement is describing (props
in, events out, slots where it makes sense), so following it strictly
wasn't extra work, it was the natural shape once I took the requirement
seriously. The one thing this costs me is upkeep: I keep a full
prop/event/slot table per component in
[architecture.md](./architecture.md#component-contracts), and
whenever I rename something on the Stencil side (which happened, to dodge
native DOM name collisions: `recipeTitle` not `title`, `formSubmit` not
`submit`, `filterChange` not `selectionchange`) I have to remember to go
update that table too, not just the component.

---

## ADR-007: Theming through inherited CSS custom properties

Once the app and the library both had styling, I needed to decide how a
shadow-DOM component library gets themed by its host. Shadow DOM blocks
outside stylesheets on purpose, so the obvious options were: expose a
`theme` prop on every component and prop-drill an object through the tree;
ship a stylesheet consumers import and override; or use `::part()` and let
consumers style internals directly.

I went with none of those. Every colour, radius, shadow and font is a
`--ruik-*` custom property defined once on `:root` in the app's
`app.css`, and each Stencil component reads it as
`var(--ruik-color-primary, <fallback>)` rather than defining its own value
on `:host`.

This works because **CSS custom properties inherit through shadow
boundaries** — one of the few things that does. So the host themes the
whole library from a single place with no API surface at all: no theme
prop, no imported stylesheet, no `::part()` contract to maintain. The
per-component fallback matters too — it keeps each component presentable
in its own standalone dev preview, where the app's `:root` block does not
exist.

The payoff showed up immediately with dark mode, which turned out to be a
second block of the same variable names under
`@media (prefers-color-scheme: dark)` and **zero** changes in any
component, because components only ever read tokens, never define them.

The cost is that the token names are now a real, if implicit, contract: if
I rename `--ruik-color-primary`, seven components silently fall back to
their defaults rather than failing loudly. That is a trade I accepted for
having no theming API to version.

---

## ADR-008: `recipe-ui-kit` excluded from Vite's dependency pre-bundler

This one wasn't a design choice so much as a bug I had to work around, but
it's worth writing down because it'll bite again if I ever remove the fix.

After rebuilding and repacking `recipe-ui-kit` a few times during
development, the app's dev server started 404ing on specific files like
`recipe-ui-card_6.entry.js`, with Vite's own error message pointing
straight at the fix: "Try adding it to `optimizeDeps.exclude`." What's
actually happening: `@srikar_sundram/recipe-ui-kit/loader` does its own runtime `import()`
of per-component lazy chunks — that's the entire point of Stencil's
lazy-loading model. Vite's dependency scanner tries to follow those
dynamic imports and pre-bundle them too, and it caches what it finds under
`node_modules/.vite/deps`, keyed by filename. Those filenames are
content-hashed by Stencil's build, so every time I rebuild and repack the
library the hashes change — but a tarball reinstall doesn't bump a version
number, so Vite never gets a signal that anything changed and keeps
serving its stale cache.

The fix is one line in `vite.config.ts`:
`optimizeDeps.exclude: ['recipe-ui-kit', '@srikar_sundram/recipe-ui-kit/loader']`. That's
safe here specifically because the package is only ever imported lazily,
inside `onMount`, in the browser — it never needs to be part of Vite's
eager module graph in the first place.

What this means practically: if I rebuild+repack the library while the dev
server is already running, I still need to either restart `npm run dev` or
clear `node_modules/.vite/` — excluding it from pre-bundling stopped the
404s, it doesn't make Vite psychic about a tarball's contents changing
underneath it.

---

## ADR-009: Discovery — search intersects filters rather than overriding them

The first version of the discovery page treated a search term as a mode
switch: if the box had text, run `search.php` and ignore the filter chips;
otherwise run `filter.php` for whatever was selected. I wrote it that way
because TheMealDB's two endpoint families are genuinely separate — they
take different parameters and return different shapes — and combining them
means doing the work client-side.

It was the wrong call, and it showed up the moment I used the app like a
user instead of like its author. You pick "Japanese", scroll a bit, then
type "chicken" to narrow it down — and your cuisine filter silently
evaporates. Nothing in the UI told you that happened. "Search *or* filter"
is a defensible reading of the brief, but "search *within* my filters" is
what anyone actually expects from a search box sitting above filter chips.

So now search is not special: it is one more constraint. The rules, all of
which live in `app/src/lib/search/compose.ts`:

- **within** an axis, selections union (Chicken + Dessert = either, since
  a recipe that is both essentially never exists);
- **across** axes, results intersect (Chicken + Japanese = both);
- a search term is just another axis, so it intersects too.

Two things made this worth the extra work rather than a hack. First, the
result sets involved are small — a few hundred records at most — so a
client-side intersection costs nothing measurable. Second, and more
importantly, I extracted the whole thing into a **pure module** with no
fetching in it. The route decides which calls to make; `compose.ts` decides
what the combined answer is. That is what made 21 tests over the set
algebra possible without a browser or a network, and the edge cases turned
out to be exactly where the bugs would have been: an empty search result
(`[]`) means something completely different from no search at all
(`null`), and an active axis that matched nothing must empty the result
while an *omitted* axis means "unconstrained".

The one wrinkle I had to handle explicitly: `filter.php` returns bare
summaries with no category, `search.php` returns full detail. Intersecting
naively would have stripped the category badge off every card as soon as a
filter was involved, so `mergePreferDetail()` upgrades a summary to the
detailed record whenever both arrive for the same id — and never
downgrades.

---

## ADR-010: Curated ingredient filter options

Adding a main-ingredient filter meant deciding where the options come
from. `list.php?i=list` returns TheMealDB's full ingredient list, and my
first instinct was to use it, the same way the category and cuisine rows
use `list.php?c=list` and `list.php?a=list`.

That list has roughly **600 entries**. Rendered as chips it would be
several screens tall, dwarfing the recipes it is supposed to filter, and
most entries match one or two recipes — so the majority of the UI would be
dead weight. Categories (14) and areas (~29) are fine as exhaustive chip
rows; ingredients are not.

The alternatives I considered were a searchable combobox or a "show more"
disclosure. Both are more component than this needs, and a combobox in
particular would have meant a new Stencil component with real
keyboard-interaction complexity — a lot of surface area for one filter
axis on an assignment about integration.

So `app/src/lib/search/ingredients.ts` holds a hand-picked list of 12
common staples. The values must match TheMealDB's own spelling exactly
since they go straight into `filter.php?i=`, which is the one fragile part
of this and the reason the constant carries a comment saying so. If this
ever needs to be exhaustive, the fix is a searchable input, not 600 chips.

---

## ADR-011: `adapter-static`, not `adapter-vercel`

I had settled on Vercel as the deploy target and installed
`@sveltejs/adapter-vercel`. Then `npm run build` failed on Windows with
`EPERM: symlink` — the adapter creates a symlink inside
`.vercel/output/functions`, and Windows refuses that without Developer
Mode or an elevated shell.

Vercel's own Linux builders would have been fine, so I could have shrugged
and let CI handle it. I decided a project whose production build cannot be
run locally by whoever is grading it is not acceptable, and went looking at
what this app actually needs from an adapter.

The answer is nothing. I checked: no `+page.server.ts`, no
`+layout.server.ts`, no `load` functions of any kind, no
`hooks.server.ts`. Every byte of data comes from either TheMealDB (fetched
in the browser) or `localStorage`. There is no serverless function to
deploy, because there is no server-side code to put in one — which follows
directly from [ADR-005](#adr-005-state--persistence--no-backend-browser-storage-only).

So `@sveltejs/adapter-static` is not a workaround, it is the honest
description of what this is: a static site. It builds on any OS, deploys to
Vercel with zero extra configuration (Vercel serves static output
natively), and would work just as well on Netlify, Cloudflare Pages or
GitHub Pages if the target ever changes.

Two details this forced:

- `/recipes/[id]` and its `edit` child **cannot** be prerendered — the ids
  come from TheMealDB or a user's own storage and are unknowable at build
  time. Each has a `+page.ts` with `prerender = false`, and the static
  adapter's `fallback` page serves them for client-side rendering. Every
  other route prerenders via `prerender = true` in `+layout.ts`.
- The fallback is named `200.html`, not `index.html`, because `/` already
  prerenders to `index.html` and the adapter warned it was overwriting it.
  `vercel.json` then rewrites unmatched paths to `/200.html` — filesystem
  matches win first on Vercel, so prerendered routes still serve directly.

---

## ADR-012: Where validation lives, and why there are two layers

Related to [ADR-006](#adr-006-component-boundary-between-stencil-and-svelte)
but worth its own entry, because "the form validates itself" is the obvious
design and I deliberately did not do it.

`<recipe-ui-form>` has no business validation. It marks Title and
Instructions as `required` for baseline browser UX, and that is the extent
of it. The rules — what a valid recipe *is* — live in
`app/src/lib/validation/recipe.ts`, and the app feeds failures back into
the component through its `errors` prop.

The reason is reusability. A title limit of 120 characters, or a
requirement that at least one ingredient be named, are facts about *this
application's data model*, not about "a recipe form". Baking them into the
component would mean the next consumer inherits this app's business rules
whether they want them or not, and has no way to override them. Props in,
events out, host owns the rules — the same boundary as everywhere else.

What I did not anticipate is that this produces a genuinely useful
**two-layer** arrangement rather than a redundant one. The browser's
`required` catches a truly empty field instantly, with no round trip and
no JavaScript. But `required` happily accepts `"   "` — three spaces is a
non-empty value as far as HTML is concerned. So the app layer is what
catches whitespace-only input, the character limit, and an ingredient list
whose every row has a measure but no name. The seam between the two is
where the interesting test cases live, and it is called out explicitly in
[testing.md](./testing.md).
