/**
 * Prerender every route that can be enumerated at build time. The app has no
 * server-side data loading, so the prerendered output is the final HTML shell
 * plus the client bundle — see docs/decisions.md ADR-011.
 *
 * `/recipes/[id]` opts out (its own +page.ts): recipe ids come from TheMealDB
 * at runtime and cannot be enumerated, so those are served by the static
 * adapter's `fallback` page and rendered on the client.
 */
export const prerender = true;
