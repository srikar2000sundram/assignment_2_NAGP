# Runbook — publish, push, deploy

**All three steps below are done.** The package is published, the repo is
pushed, and the app is deployed — see the **Links** table in
[`../README.md`](../README.md) for the live URLs. This file is kept as a
record of the exact commands used and the order they had to run in
(publishing first, so the app could depend on the real registry version
before the repo was pushed and deployed), and as the reference for cutting
a future release — see *Releasing a later version of the library* at the
end.

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
2026-08-28, before this was published, which is why it's scoped rather
than unscoped.

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
written against the published surface all along.

Record the package URL —
`https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit` — in the
**Links** table in [`../README.md`](../README.md).

---

## Step 2 — push to GitHub

One repository, not two — the app and the library each have their own
`package.json`, but the deliverables ask for a single "Link to github
repository", so `recipe-ui-kit/` is a plain subdirectory here (its
separate git history wasn't preserved). See
[assumptions.md](./assumptions.md#tooling) for why. Everything goes to
one repo:

```sh
cd recipe-ui-kit && rm -rf .git       # drop its independent history
cd ..                                  # ASSIGNMENT_2/
git add -A
git commit -m "Bring the component library into this repository"
git remote add origin https://github.com/<you>/<your-repo>.git
git push -u origin main
```

Record the URL in the **Links** table in [`../README.md`](../README.md).

> The two-repo concern this step was originally guarding against — a fresh
> clone of the app being unable to resolve a `file:../recipe-ui-kit/...tgz`
> dependency — doesn't apply once the library is on the registry. The app
> depends on `^0.2.0` from npm regardless of how many repos it lives in.

---

## Step 3 — deploy to Vercel

The app builds to a static site — no server-side code anywhere, see
[assumptions.md](./assumptions.md#deployment) — and `vercel.json` already
contains the SPA rewrite that the client-rendered `/recipes/<id>` routes
need.

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

> The first deploy attempt here failed with "No Output Directory named
> dist found", because this project has no `svelte.config.js` (the adapter
> is configured inside `vite.config.ts` instead), so Vercel's framework
> detection fell back to generic Vite and guessed `dist` instead of the
> `build/` folder `adapter-static` actually writes to. The fix, already in
> `vercel.json`, is `"outputDirectory": "build"`. If you ever remove or
> regenerate `vercel.json`, keep that key.

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

After all three steps, the three rows in [`../README.md`](../README.md)'s
**Links** table and the corresponding rows in
[requirements-traceability.md](./requirements-traceability.md) get filled
in / flipped to ✅:

| Deliverable | Value |
|---|---|
| npm package link | `https://www.npmjs.com/package/@srikar_sundram/recipe-ui-kit` |
| GitHub repository | `https://github.com/<you>/<your-repo>` |
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
