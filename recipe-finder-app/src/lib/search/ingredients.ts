/**
 * Curated main-ingredient filter options.
 *
 * TheMealDB's `list.php?i=list` returns ~600 ingredients, which is unusable as
 * a chip row — it would dwarf the rest of the page and most entries match one
 * or two recipes. So the ingredient axis offers a hand-picked shortlist of
 * common staples instead of the full list. See docs/decisions.md ADR-010.
 *
 * Values must match TheMealDB's ingredient spelling exactly, since they are
 * passed straight to `filter.php?i=`.
 */
import type { FilterOption } from '@srikar_sundram/recipe-ui-kit';

export const COMMON_INGREDIENTS: FilterOption[] = [
	{ value: 'Chicken', label: 'Chicken' },
	{ value: 'Beef', label: 'Beef' },
	{ value: 'Salmon', label: 'Salmon' },
	{ value: 'Rice', label: 'Rice' },
	{ value: 'Potatoes', label: 'Potatoes' },
	{ value: 'Onion', label: 'Onion' },
	{ value: 'Garlic', label: 'Garlic' },
	{ value: 'Tomatoes', label: 'Tomatoes' },
	{ value: 'Cheese', label: 'Cheese' },
	{ value: 'Eggs', label: 'Eggs' },
	{ value: 'Mushrooms', label: 'Mushrooms' },
	{ value: 'Spinach', label: 'Spinach' }
];
