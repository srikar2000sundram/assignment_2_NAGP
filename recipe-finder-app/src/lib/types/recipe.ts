/**
 * Shared domain types. Mirrors docs/data-model.md — keep both in sync.
 */

export type RecipeSource = 'api' | 'user';

export interface RecipeIngredient {
	name: string;
	measure: string;
}

/** A recipe, whether sourced from TheMealDB or created by the user. */
export interface Recipe {
	id: string;
	source: RecipeSource;
	title: string;
	image: string | null;
	category: string | null;
	area: string | null;
	ingredients: RecipeIngredient[];
	instructions: string;
	tags: string[];
	/** ISO timestamps; null for API recipes (the app doesn't own that data). */
	createdAt: string | null;
	updatedAt: string | null;
}

/** Lightweight pointer used inside favorites/meal-plan storage instead of a full Recipe snapshot. */
export interface RecipeRef {
	id: string;
	source: RecipeSource;
}

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday',
	sun: 'Sunday'
};
