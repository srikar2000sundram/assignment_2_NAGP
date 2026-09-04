// Recipe ids are unknowable at build time (they come from TheMealDB, or from
// the user's own localStorage), so this route is client-rendered via the
// static adapter's fallback page rather than prerendered.
export const prerender = false;
