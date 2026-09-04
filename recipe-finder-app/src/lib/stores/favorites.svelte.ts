/**
 * Favorites store — docs/data-model.md#favorites-store. Holds identity only
 * (id + source), never a full Recipe snapshot, so favorited recipes are
 * always resolved fresh from their source of truth on read.
 */
import { readStorage, writeStorage } from './storage';
import type { RecipeRef } from '$lib/types/recipe';

const STORAGE_KEY = 'recipe-finder:favorites:v1';

interface FavoritesState {
	ids: RecipeRef[];
}

function load(): RecipeRef[] {
	return readStorage<FavoritesState>(STORAGE_KEY, { ids: [] }).ids;
}

function createFavoritesStore() {
	let ids = $state<RecipeRef[]>(load());

	function persist() {
		writeStorage<FavoritesState>(STORAGE_KEY, { ids });
	}

	function isFavorite(id: string): boolean {
		return ids.some((ref) => ref.id === id);
	}

	function add(ref: RecipeRef) {
		if (!isFavorite(ref.id)) {
			ids = [...ids, ref];
			persist();
		}
	}

	function remove(id: string) {
		if (!isFavorite(id)) return;
		ids = ids.filter((ref) => ref.id !== id);
		persist();
	}

	function toggle(ref: RecipeRef) {
		if (isFavorite(ref.id)) {
			remove(ref.id);
		} else {
			add(ref);
		}
	}

	return {
		get ids() {
			return ids;
		},
		isFavorite,
		add,
		remove,
		toggle
	};
}

export const favorites = createFavoritesStore();
