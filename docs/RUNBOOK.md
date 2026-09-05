# Runbook — publish, push, deploy

Three steps remain, and all three need credentials that are not on this
machine (`npm whoami` returns `ENEEDAUTH`; the `gh` CLI is not installed).
Everything up to the credentialed command is already done — this file is
the exact sequence to finish.

Do them in order: publishing first means the app can depend on the real
registry version before the repo is pushed and deployed.

## Before you start — one value to fill in

`recipe-ui-kit/package.json` has `<YOUR-GITHUB-USERNAME>` in three places
(`repository.url`, `homepage`, `bugs.url`). Replace it:

```sh
cd recipe-ui-kit
sed -i 's/<YOUR-GITHUB-USERNAME>/your-actual-username/g' package.json
```

---

## Step 1 — publish the component library to npm

The package publishes as **`@srikar_sundram/recipe-ui-kit`**, scoped to the
npm account. The unscoped `recipe-ui-kit` was claimed by someone else on
2026-08-28, before this was published — see the amendment on
[ADR-004](./decisions.md#adr-004-published-package-name).

```sh
cd recipe-ui-kit
npm whoami                       # must print your username first
npm publish --access public      # --access public is required for a scoped package
```

`prepublishOnly` rebuilds `dist/` automatically, so a stale build cannot
ship. If 2FA is enabled you will be asked for an OTP.

> If `npm login` crashes with `Exit handler never called!`, that is a known
> npm CLI bug in the browser handshake. Use `npm login --auth-type=legacy`
> instead, or set a granular access token:
> `npm config set //registry.npmjs.org/:_authToken=<token>`.

Then repoint the app from the local tarball at the registry version:

```sh
cd ../recipe-finder-app
npm install @srikar_sundram/recipe-ui-kit@^0.2.0
rm -rf node_modules/.vite            # clear Vite's stale dep cache
npm run build                        # confirm it still builds
```

`package.json` should now read `"@srikar_sundram/recipe-ui-kit": "^0.2.0"`
instead of the `file:` tarball path. Nothing else changes — the app was
written against the published surface all along, which is the point of
[ADR-004](./decisions.md#adr-004-published-package-name).

Record the package URL —
`https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit` — in the
**Links** table in [`../README.md`](../README.md).

---

## Step 2 — push both projects to GitHub

Two repositories, per
[ADR-001](./decisions.md#adr-001-two-sibling-projects-instead-of-a-monorepo).
Create both as **empty** repos on GitHub first (no README, no .gitignore —
this repo already has them).

### 2a — the component library

It already has a local git repo with one commit from the Stencil starter,
so this adds the work on top:

```sh
cd recipe-ui-kit
git add -A
git commit -m "Recipe UI kit v0.2.0: 7 components, 73 tests, changelog"
git branch -M main
git remote add origin https://github.com/<you>/recipe-ui-kit.git
git push -u origin main
git tag v0.2.0 && git push --tags     # tag the published version
```

### 2b — the app + docs

This tree is already initialised and committed locally (see
`git log --oneline`), with `recipe-ui-kit/` excluded via `.gitignore` so
the library stays its own repo:

```sh
cd ..                                  # ASSIGNMENT_2/
git remote add origin https://github.com/<you>/recipe-finder-app.git
git push -u origin main
```

Record both URLs in the **Links** table in [`../README.md`](../README.md).

> Note: because the two repos are independent, a fresh clone of the app
> repo cannot resolve a `file:../recipe-ui-kit/...tgz` dependency. That is
> exactly why step 1 comes first — after it, the app depends on `^0.2.0`
> from the registry and clones cleanly on its own.

---

## Step 3 — deploy to Vercel

The app builds to a static site (no server-side code anywhere — see
[ADR-011](./decisions.md#adr-011-adapter-static-not-adapter-vercel)), and
`vercel.json` already contains the SPA rewrite that the client-rendered
`/recipes/<id>` routes need.

Confirm the build locally first:

```sh
cd recipe-finder-app
npm run build          # writes build/
npm run preview        # serve it at http://localhost:5174
```

Then either connect the repo through the dashboard:

1. <https://vercel.com/new> → import the `recipe-finder-app` repo.
2. Set **Root Directory** to `recipe-finder-app` (the repo root is
   `ASSIGNMENT_2/`, one level up).
3. Framework preset: **SvelteKit**. Build command `npm run build`, output
   directory `build`. Vercel usually detects all three.
4. Deploy.

…or from the CLI:

```sh
npm i -g vercel
cd recipe-finder-app
vercel            # preview deploy
vercel --prod     # production deploy
```

Record the resulting URL in the **Links** table in
[`../README.md`](../README.md).

### After deploying, check

- `/` loads and the browse grid populates (proves TheMealDB is reachable
  from the deployed origin — it sets permissive CORS headers, so it is).
- **Navigate to a recipe, then hard-refresh that URL.** This is the one
  thing that would break without the `vercel.json` rewrite: `/recipes/52772`
  is not a prerendered file, so it must fall through to `200.html`.
- Create a recipe, reload, confirm it is still there (`localStorage`).
- Toggle your OS to dark mode.

---

## Finishing the deliverables

After all three steps, fill in the four rows in
[`../README.md`](../README.md)'s **Links** table and flip the four ⏳ rows in
[requirements-traceability.md](./requirements-traceability.md) to ✅:

| Deliverable | Value |
|---|---|
| npm package link | `https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit` |
| GitHub — component library | `https://github.com/<you>/recipe-ui-kit` |
| GitHub — app | `https://github.com/<you>/recipe-finder-app` |
| Deployed application URL | the Vercel URL |

## Releasing a later version of the library

```sh
cd recipe-ui-kit
# 1. add a section at the top of CHANGELOG.md
# 2. bump per the policy in docs/architecture.md#7-versioning
npm version minor          # or patch / major — also creates a git tag
npm publish
git push && git push --tags

cd ../recipe-finder-app
npm install @srikar_sundram/recipe-ui-kit@latest
```
