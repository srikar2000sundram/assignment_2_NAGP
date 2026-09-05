/**
 * User-created recipes store — docs/data-model.md#user-recipes-store. Owns
 * the CRUD operations behind the Recipe Management requirement, plus the
 * referential-integrity cascade on delete (favorites + meal plan).
 */
import { readStorage, writeStorage } from './storage';
import type { Recipe } from '$lib/types/recipe';
import type { RecipeFormValue } from '@srikar_sundram/recipe-ui-kit';
import { favorites } from './favorites.svelte';
import { mealPlan } from './mealPlan.svelte';

const STORAGE_KEY = 'recipe-finder:user-recipes:v1';

interface UserRecipesState {
	recipes: Recipe[];
}

function load(): Recipe[] {
	return readStorage<UserRecipesState>(STORAGE_KEY, { recipes: [] }).recipes;
}

function generateId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createUserRecipesStore() {
	let recipes = $state<Recipe[]>(load());

	function persist() {
		writeStorage<UserRecipesState>(STORAGE_KEY, { recipes });
	}

	function get(id: string): Recipe | undefined {
		return recipes.find((r) => r.id === id);
	}

	function create(value: RecipeFormValue): Recipe {
		const now = new Date().toISOString();
		const recipe: Recipe = {
			id: generateId(),
			source: 'user',
			title: value.title.trim(),
			image: value.image,
			category: value.category,
			area: null,
			ingredients: value.ingredients,
			instructions: value.instructions,
			tags: [],
			createdAt: now,
			updatedAt: now
		};
		recipes = [...recipes, recipe];
		persist();
		return recipe;
	}

	function update(id: string, value: RecipeFormValue): Recipe | undefined {
		const existing = get(id);
		if (!existing) return undefined;
		const updated: Recipe = {
			...existing,
			title: value.title.trim(),
			image: value.image,
			category: value.category,
			ingredients: value.ingredients,
			instructions: value.instructions,
			updatedAt: new Date().toISOString()
		};
		recipes = recipes.map((r) => (r.id === id ? updated : r));
		persist();
		return updated;
	}

	function remove(id: string) {
		if (!get(id)) return;
		recipes = recipes.filter((r) => r.id !== id);
		persist();
		// Cascade so the UI never renders a favorite/meal-plan slot pointing at a recipe that no longer exists.
		favorites.remove(id);
		mealPlan.removeReferencesTo(id);
	}

	return {
		get all() {
			return recipes;
		},
		get,
		create,
		update,
		remove
	};
}

export const userRecipes = createUserRecipesStore();
