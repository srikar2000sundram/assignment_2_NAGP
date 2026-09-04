/**
 * Weekly meal-plan store — docs/data-model.md#meal-plan-store. One recipe
 * reference per weekday; resolved to a full Recipe at render time by the
 * /meal-plan route, same pattern as favorites.
 */
import { readStorage, writeStorage } from './storage';
import { WEEKDAYS, type Weekday, type RecipeRef } from '$lib/types/recipe';

const STORAGE_KEY = 'recipe-finder:meal-plan:v1';

type Slots = Record<Weekday, RecipeRef | null>;

function emptySlots(): Slots {
	return WEEKDAYS.reduce((acc, day) => {
		acc[day] = null;
		return acc;
	}, {} as Slots);
}

function load(): Slots {
	return readStorage<{ slots: Slots }>(STORAGE_KEY, { slots: emptySlots() }).slots;
}

function createMealPlanStore() {
	let slots = $state<Slots>(load());

	function persist() {
		writeStorage(STORAGE_KEY, { slots });
	}

	function assign(day: Weekday, ref: RecipeRef) {
		slots = { ...slots, [day]: ref };
		persist();
	}

	function unassign(day: Weekday) {
		slots = { ...slots, [day]: null };
		persist();
	}

	/** Cascade delete: called by userRecipes.remove() so a deleted recipe never lingers in the plan. */
	function removeReferencesTo(id: string) {
		let changed = false;
		const next = { ...slots };
		for (const day of WEEKDAYS) {
			if (next[day]?.id === id) {
				next[day] = null;
				changed = true;
			}
		}
		if (changed) {
			slots = next;
			persist();
		}
	}

	return {
		get slots() {
			return slots;
		},
		assign,
		unassign,
		removeReferencesTo
	};
}

export const mealPlan = createMealPlanStore();
