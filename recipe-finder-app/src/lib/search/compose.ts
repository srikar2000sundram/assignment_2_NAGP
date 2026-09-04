/**
 * Pure set algebra for Recipe Discovery.
 *
 * This is deliberately separate from the `/` route and does no fetching: the
 * route decides *which* TheMealDB calls to make, this module decides what the
 * combined result of those calls is. Keeping it pure is what makes the
 * search/filter interaction testable without a browser or a network — see
 * `compose.test.ts` and docs/testing.md.
 *
 * The rules, in one place:
 *
 *  - **Within** one filter axis, selections UNION. Picking Chicken *and*
 *    Dessert means "either", because asking for a recipe that is both is
 *    almost always an empty set.
 *  - **Across** axes, results INTERSECT. Chicken + Italian + Garlic means all
 *    three must hold — each axis narrows the previous one.
 *  - A search term is just another axis, so it intersects too rather than
 *    overriding the filters (which is what the first version of this app did).
 *  - `search.php` returns full details while `filter.php` returns bare
 *    summaries, so when the same recipe arrives from both, the detail-bearing
 *    record wins — otherwise intersecting would strip the category badge off
 *    every card.
 *
 * See docs/decisions.md ADR-009.
 */
import type { Recipe } from '$lib/types/recipe';

/** One filter axis' worth of already-fetched, already-unioned results. */
export interface RecipeAxis {
	/** Human-readable axis name; used only for diagnostics/tests. */
	name: string;
	recipes: Recipe[];
}

/**
 * True when a record carries detail fields. `filter.php` summaries have no
 * category/area/ingredients/instructions, so this distinguishes the two shapes
 * without either endpoint having to tell us which one it was.
 */
function isDetailed(recipe: Recipe): boolean {
	return Boolean(
		recipe.category || recipe.area || recipe.instructions || recipe.ingredients.length > 0
	);
}

/**
 * Deduplicate by id, preferring whichever record for an id carries detail.
 * Order follows first appearance, so the caller controls result ordering.
 */
export function mergePreferDetail(...groups: Recipe[][]): Recipe[] {
	const byId = new Map<string, Recipe>();
	const order: string[] = [];

	for (const group of groups) {
		for (const recipe of group) {
			const existing = byId.get(recipe.id);
			if (!existing) {
				byId.set(recipe.id, recipe);
				order.push(recipe.id);
				continue;
			}
			// Upgrade a summary to a detailed record; never downgrade.
			if (!isDetailed(existing) && isDetailed(recipe)) {
				byId.set(recipe.id, recipe);
			}
		}
	}

	return order.map((id) => byId.get(id)!);
}

/** Union within an axis: every selection's matches, deduped. */
export function unionAxis(groups: Recipe[][]): Recipe[] {
	return mergePreferDetail(...groups);
}

/**
 * Intersect the given axes by recipe id.
 *
 * Only axes that are actually active should be passed in — an empty axis list
 * means "no constraints", which is the caller's cue to show the default browse
 * set, not an empty result. An *active* axis that matched nothing correctly
 * yields an empty intersection.
 *
 * Output order follows the FIRST axis, deliberately: ordering must be
 * predictable for both the UI and the tests. (Narrowing from the smallest axis
 * would be marginally cheaper, but would make result order depend on which
 * axis happened to be smallest — and these result sets are a few hundred items
 * at most, so there is nothing to win.)
 */
export function intersectAxes(axes: RecipeAxis[]): Recipe[] {
	if (axes.length === 0) return [];

	const [first, ...rest] = axes;
	const idSets = rest.map((axis) => new Set(axis.recipes.map((r) => r.id)));
	const survivors = first.recipes.filter((recipe) => idSets.every((ids) => ids.has(recipe.id)));

	// Pull the richer copy of each survivor out of whichever axis carries detail,
	// so intersecting never strips a card's category badge.
	const survivorIds = new Set(survivors.map((r) => r.id));
	const enrichment = rest.flatMap((axis) => axis.recipes.filter((r) => survivorIds.has(r.id)));

	return mergePreferDetail(survivors, enrichment);
}

export interface ComposeInput {
	/** Results of the name search, or null when no search term is active. */
	searchResults: Recipe[] | null;
	/**
	 * Active filter axes ONLY — an axis with no selection must not be passed in.
	 * The distinction matters: an omitted axis is "unconstrained", whereas an
	 * axis that is present but matched nothing correctly empties the result.
	 */
	axes: RecipeAxis[];
	/** The default browse set, shown when nothing at all is active. */
	browseResults: Recipe[];
}

/**
 * Combine a search term and any number of filter axes into the final result
 * list. This is the single place the "what does the grid show?" question is
 * answered.
 */
export function composeResults({ searchResults, axes, browseResults }: ComposeInput): Recipe[] {
	const constraints: RecipeAxis[] = [...axes];

	if (searchResults !== null) {
		constraints.push({ name: 'search', recipes: searchResults });
	}

	// Nothing constrains the result: fall back to the browse set.
	if (constraints.length === 0) return browseResults;

	return intersectAxes(constraints);
}
