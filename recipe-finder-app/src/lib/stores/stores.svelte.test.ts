import { describe, it, expect, beforeEach } from 'vitest';
import { favorites } from './favorites.svelte';
import { mealPlan } from './mealPlan.svelte';
import { userRecipes } from './userRecipes.svelte';
import { WEEKDAYS } from '$lib/types/recipe';
import type { RecipeFormValue } from '@srikar_sundram/recipe-ui-kit';

/**
 * Runs in the `client` vitest project (real Chromium, real localStorage) because
 * these stores are Svelte 5 runes modules and genuinely persist.
 *
 * The stores are module singletons initialised from localStorage at import
 * time, so these tests reset state through the stores' own public API rather
 * than by reloading modules — which also means the reset path itself is under
 * test on every run.
 */

const FAVORITES_KEY = 'recipe-finder:favorites:v1';
const MEAL_PLAN_KEY = 'recipe-finder:meal-plan:v1';
const USER_RECIPES_KEY = 'recipe-finder:user-recipes:v1';

function draft(overrides: Partial<RecipeFormValue> = {}): RecipeFormValue {
	return {
		title: 'Test Recipe',
		image: null,
		category: null,
		instructions: 'Cook it.',
		ingredients: [{ name: 'Salt', measure: 'a pinch' }],
		...overrides
	};
}

function resetAll() {
	for (const ref of [...favorites.ids]) favorites.remove(ref.id);
	for (const day of WEEKDAYS) mealPlan.unassign(day);
	for (const recipe of [...userRecipes.all]) userRecipes.remove(recipe.id);
}

beforeEach(() => {
	resetAll();
});

describe('favorites store', () => {
	it('starts empty after a reset', () => {
		expect(favorites.ids).toEqual([]);
	});

	it('adds a favorite and reports it as favorited', () => {
		favorites.add({ id: '52772', source: 'api' });
		expect(favorites.isFavorite('52772')).toBe(true);
		expect(favorites.ids).toEqual([{ id: '52772', source: 'api' }]);
	});

	it('ignores a duplicate add rather than storing the id twice', () => {
		favorites.add({ id: '52772', source: 'api' });
		favorites.add({ id: '52772', source: 'api' });
		expect(favorites.ids).toHaveLength(1);
	});

	it('removes a favorite', () => {
		favorites.add({ id: '52772', source: 'api' });
		favorites.remove('52772');
		expect(favorites.isFavorite('52772')).toBe(false);
		expect(favorites.ids).toEqual([]);
	});

	it('treats removing an unknown id as a no-op', () => {
		favorites.add({ id: '52772', source: 'api' });
		expect(() => favorites.remove('not-there')).not.toThrow();
		expect(favorites.ids).toHaveLength(1);
	});

	it('toggles on and back off', () => {
		favorites.toggle({ id: '52772', source: 'api' });
		expect(favorites.isFavorite('52772')).toBe(true);
		favorites.toggle({ id: '52772', source: 'api' });
		expect(favorites.isFavorite('52772')).toBe(false);
	});

	it('keeps the source alongside the id, so user recipes resolve locally', () => {
		favorites.add({ id: 'local-1', source: 'user' });
		expect(favorites.ids[0].source).toBe('user');
	});

	it('preserves insertion order', () => {
		favorites.add({ id: 'a', source: 'api' });
		favorites.add({ id: 'b', source: 'api' });
		favorites.add({ id: 'c', source: 'api' });
		expect(favorites.ids.map((r) => r.id)).toEqual(['a', 'b', 'c']);
	});

	it('persists identity only — never a full recipe snapshot', () => {
		favorites.add({ id: '52772', source: 'api' });
		const raw = JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!);
		expect(raw).toEqual({ ids: [{ id: '52772', source: 'api' }] });
		expect(JSON.stringify(raw)).not.toContain('title');
	});
});

describe('mealPlan store', () => {
	it('starts with every weekday empty', () => {
		expect(WEEKDAYS.every((day) => mealPlan.slots[day] === null)).toBe(true);
	});

	it('assigns a recipe to a day', () => {
		mealPlan.assign('mon', { id: '52772', source: 'api' });
		expect(mealPlan.slots.mon).toEqual({ id: '52772', source: 'api' });
	});

	it('leaves the other days untouched when one is assigned', () => {
		mealPlan.assign('wed', { id: '52772', source: 'api' });
		expect(mealPlan.slots.mon).toBeNull();
		expect(mealPlan.slots.sun).toBeNull();
	});

	it('overwrites a filled day — this is the "modify a planned meal" path', () => {
		mealPlan.assign('tue', { id: 'first', source: 'api' });
		mealPlan.assign('tue', { id: 'second', source: 'user' });
		expect(mealPlan.slots.tue).toEqual({ id: 'second', source: 'user' });
	});

	it('unassigns a day', () => {
		mealPlan.assign('thu', { id: '52772', source: 'api' });
		mealPlan.unassign('thu');
		expect(mealPlan.slots.thu).toBeNull();
	});

	it('treats unassigning an already-empty day as a no-op', () => {
		expect(() => mealPlan.unassign('fri')).not.toThrow();
		expect(mealPlan.slots.fri).toBeNull();
	});

	it('allows the same recipe on several days', () => {
		mealPlan.assign('mon', { id: 'same', source: 'api' });
		mealPlan.assign('sat', { id: 'same', source: 'api' });
		expect(mealPlan.slots.mon).toEqual(mealPlan.slots.sat);
	});

	it('removes every reference to an id across all days', () => {
		mealPlan.assign('mon', { id: 'gone', source: 'user' });
		mealPlan.assign('wed', { id: 'stays', source: 'api' });
		mealPlan.assign('sun', { id: 'gone', source: 'user' });

		mealPlan.removeReferencesTo('gone');

		expect(mealPlan.slots.mon).toBeNull();
		expect(mealPlan.slots.sun).toBeNull();
		expect(mealPlan.slots.wed).toEqual({ id: 'stays', source: 'api' });
	});

	it('persists the full seven-day shape', () => {
		mealPlan.assign('mon', { id: '52772', source: 'api' });
		const raw = JSON.parse(window.localStorage.getItem(MEAL_PLAN_KEY)!);
		expect(Object.keys(raw.slots).sort()).toEqual([...WEEKDAYS].sort());
	});
});

describe('userRecipes store', () => {
	it('creates a recipe with a generated id and timestamps', () => {
		const created = userRecipes.create(draft({ title: '  Padded Title  ' }));

		expect(created.id).toBeTruthy();
		expect(created.source).toBe('user');
		expect(created.title).toBe('Padded Title');
		expect(created.createdAt).toBeTruthy();
		expect(created.updatedAt).toBe(created.createdAt);
	});

	it('assigns unique ids to successive recipes', () => {
		const a = userRecipes.create(draft());
		const b = userRecipes.create(draft());
		expect(a.id).not.toBe(b.id);
	});

	it('exposes created recipes through `all` and `get`', () => {
		const created = userRecipes.create(draft());
		expect(userRecipes.all).toHaveLength(1);
		expect(userRecipes.get(created.id)?.title).toBe('Test Recipe');
	});

	it('returns undefined for an unknown id', () => {
		expect(userRecipes.get('nope')).toBeUndefined();
	});

	it('updates a recipe and advances updatedAt but not createdAt', async () => {
		const created = userRecipes.create(draft());
		await new Promise((r) => setTimeout(r, 2));

		const updated = userRecipes.update(created.id, draft({ title: 'Renamed' }));

		expect(updated?.title).toBe('Renamed');
		expect(updated?.createdAt).toBe(created.createdAt);
		expect(updated?.updatedAt).not.toBe(created.createdAt);
	});

	it('preserves fields the form does not own, such as source and id', () => {
		const created = userRecipes.create(draft());
		const updated = userRecipes.update(created.id, draft({ title: 'Renamed' }));
		expect(updated?.id).toBe(created.id);
		expect(updated?.source).toBe('user');
	});

	it('returns undefined when updating an unknown id, without creating one', () => {
		expect(userRecipes.update('nope', draft())).toBeUndefined();
		expect(userRecipes.all).toHaveLength(0);
	});

	it('deletes a recipe', () => {
		const created = userRecipes.create(draft());
		userRecipes.remove(created.id);
		expect(userRecipes.all).toHaveLength(0);
		expect(userRecipes.get(created.id)).toBeUndefined();
	});

	it('treats deleting an unknown id as a no-op', () => {
		userRecipes.create(draft());
		expect(() => userRecipes.remove('nope')).not.toThrow();
		expect(userRecipes.all).toHaveLength(1);
	});

	it('persists across a simulated reload', () => {
		const created = userRecipes.create(draft({ title: 'Persisted' }));
		const raw = JSON.parse(window.localStorage.getItem(USER_RECIPES_KEY)!);
		expect(raw.recipes).toHaveLength(1);
		expect(raw.recipes[0]).toMatchObject({ id: created.id, title: 'Persisted', source: 'user' });
	});
});

describe('referential integrity — deleting a user recipe cascades', () => {
	it('removes the recipe from favorites', () => {
		const created = userRecipes.create(draft());
		favorites.add({ id: created.id, source: 'user' });
		expect(favorites.isFavorite(created.id)).toBe(true);

		userRecipes.remove(created.id);

		expect(favorites.isFavorite(created.id)).toBe(false);
	});

	it('clears every meal-plan day holding the recipe', () => {
		const created = userRecipes.create(draft());
		mealPlan.assign('mon', { id: created.id, source: 'user' });
		mealPlan.assign('fri', { id: created.id, source: 'user' });

		userRecipes.remove(created.id);

		expect(mealPlan.slots.mon).toBeNull();
		expect(mealPlan.slots.fri).toBeNull();
	});

	it('leaves other recipes’ favorites and plan slots alone', () => {
		const doomed = userRecipes.create(draft({ title: 'Doomed' }));
		const keeper = userRecipes.create(draft({ title: 'Keeper' }));
		favorites.add({ id: doomed.id, source: 'user' });
		favorites.add({ id: keeper.id, source: 'user' });
		mealPlan.assign('mon', { id: doomed.id, source: 'user' });
		mealPlan.assign('tue', { id: keeper.id, source: 'user' });

		userRecipes.remove(doomed.id);

		expect(favorites.isFavorite(keeper.id)).toBe(true);
		expect(mealPlan.slots.tue).toEqual({ id: keeper.id, source: 'user' });
		expect(mealPlan.slots.mon).toBeNull();
	});

	it('persists the cascade, not just the in-memory state', () => {
		const created = userRecipes.create(draft());
		favorites.add({ id: created.id, source: 'user' });
		mealPlan.assign('sat', { id: created.id, source: 'user' });

		userRecipes.remove(created.id);

		expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!).ids).toEqual([]);
		expect(JSON.parse(window.localStorage.getItem(MEAL_PLAN_KEY)!).slots.sat).toBeNull();
	});

	it('does not cascade when an API recipe shares nothing with the deleted id', () => {
		const created = userRecipes.create(draft());
		favorites.add({ id: '52772', source: 'api' });

		userRecipes.remove(created.id);

		expect(favorites.isFavorite('52772')).toBe(true);
	});
});
