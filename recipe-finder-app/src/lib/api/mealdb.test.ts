import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	searchRecipes,
	filterByCategory,
	filterByArea,
	filterByIngredient,
	lookupRecipe,
	listCategories,
	listAreas,
	randomRecipe
} from './mealdb';

/**
 * These tests pin down the normalization boundary: nothing outside mealdb.ts
 * should ever see TheMealDB's `strIngredient1..20` shape, so every branch of
 * that translation — including the awkward ones — is asserted here against a
 * mocked `fetch`. No network is touched.
 */

function mockFetchOnce(body: unknown, init: { ok?: boolean; status?: number } = {}) {
	const { ok = true, status = 200 } = init;
	return vi.fn().mockResolvedValue({
		ok,
		status,
		statusText: ok ? 'OK' : 'Internal Server Error',
		json: async () => body
	});
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

/** A raw TheMealDB detail record, with sparse ingredient slots. */
function rawDetail(overrides: Record<string, string | null> = {}) {
	return {
		idMeal: '52772',
		strMeal: 'Teriyaki Chicken Casserole',
		strMealThumb: 'https://img/teriyaki.jpg',
		strCategory: 'Chicken',
		strArea: 'Japanese',
		strInstructions: 'Preheat oven.',
		strTags: 'Meat,Casserole',
		strIngredient1: 'soy sauce',
		strMeasure1: '3/4 cup',
		strIngredient2: '  water  ',
		strMeasure2: '  1/2 cup  ',
		// Slot 3 deliberately blank, slot 4 populated — a real hole in the middle.
		strIngredient3: '',
		strMeasure3: '',
		strIngredient4: 'brown sugar',
		strMeasure4: '1/4 cup',
		strIngredient5: null,
		strMeasure5: null,
		...overrides
	};
}

describe('searchRecipes', () => {
	it('normalizes a detail record into the app Recipe shape', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail()] });

		const [recipe] = await searchRecipes('teriyaki');

		expect(recipe).toEqual({
			id: '52772',
			source: 'api',
			title: 'Teriyaki Chicken Casserole',
			image: 'https://img/teriyaki.jpg',
			category: 'Chicken',
			area: 'Japanese',
			ingredients: [
				{ name: 'soy sauce', measure: '3/4 cup' },
				{ name: 'water', measure: '1/2 cup' },
				{ name: 'brown sugar', measure: '1/4 cup' }
			],
			instructions: 'Preheat oven.',
			tags: ['Meat', 'Casserole'],
			createdAt: null,
			updatedAt: null
		});
	});

	it('skips blank and null ingredient slots without shifting the rest', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail()] });
		const [recipe] = await searchRecipes('x');
		expect(recipe.ingredients.map((i) => i.name)).toEqual(['soy sauce', 'water', 'brown sugar']);
	});

	it('trims whitespace around names and measures', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail()] });
		const [recipe] = await searchRecipes('x');
		expect(recipe.ingredients[1]).toEqual({ name: 'water', measure: '1/2 cup' });
	});

	it('keeps a named ingredient whose measure is missing', async () => {
		globalThis.fetch = mockFetchOnce({
			meals: [rawDetail({ strMeasure1: null })]
		});
		const [recipe] = await searchRecipes('x');
		expect(recipe.ingredients[0]).toEqual({ name: 'soy sauce', measure: '' });
	});

	it('returns an empty array when the API reports no matches (meals: null)', async () => {
		globalThis.fetch = mockFetchOnce({ meals: null });
		await expect(searchRecipes('nothing-matches-this')).resolves.toEqual([]);
	});

	it('URL-encodes the query', async () => {
		const fetchMock = mockFetchOnce({ meals: null });
		globalThis.fetch = fetchMock;

		await searchRecipes('chicken & rice');

		expect(fetchMock).toHaveBeenCalledWith(
			'https://www.themealdb.com/api/json/v1/1/search.php?s=chicken%20%26%20rice'
		);
	});

	it('throws a descriptive error on a non-ok response', async () => {
		globalThis.fetch = mockFetchOnce({}, { ok: false, status: 500 });
		await expect(searchRecipes('x')).rejects.toThrow(/TheMealDB request failed: 500/);
	});
});

describe('tag normalization', () => {
	it('treats a null tags field as no tags', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail({ strTags: null })] });
		const [recipe] = await searchRecipes('x');
		expect(recipe.tags).toEqual([]);
	});

	it('drops empty segments from a trailing or doubled comma', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail({ strTags: 'Meat,,Casserole,' })] });
		const [recipe] = await searchRecipes('x');
		expect(recipe.tags).toEqual(['Meat', 'Casserole']);
	});

	it('trims whitespace around tags', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail({ strTags: ' Meat , Spicy ' })] });
		const [recipe] = await searchRecipes('x');
		expect(recipe.tags).toEqual(['Meat', 'Spicy']);
	});

	it('defaults missing instructions to an empty string, not null', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail({ strInstructions: null })] });
		const [recipe] = await searchRecipes('x');
		expect(recipe.instructions).toBe('');
	});
});

describe('filter endpoints', () => {
	const rawSummary = {
		idMeal: '52940',
		strMeal: 'Brown Stew Chicken',
		strMealThumb: 'https://img/stew.jpg'
	};

	it('maps summaries with detail fields left empty', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawSummary] });

		const [recipe] = await filterByCategory('Chicken');

		expect(recipe).toEqual({
			id: '52940',
			source: 'api',
			title: 'Brown Stew Chicken',
			image: 'https://img/stew.jpg',
			category: null,
			area: null,
			ingredients: [],
			instructions: '',
			tags: [],
			createdAt: null,
			updatedAt: null
		});
	});

	it.each([
		['filterByCategory', filterByCategory, 'filter.php?c='],
		['filterByArea', filterByArea, 'filter.php?a='],
		['filterByIngredient', filterByIngredient, 'filter.php?i=']
	])('%s hits the right endpoint', async (_name, fn, path) => {
		const fetchMock = mockFetchOnce({ meals: null });
		globalThis.fetch = fetchMock;

		await fn('Chicken');

		expect(fetchMock).toHaveBeenCalledWith(
			`https://www.themealdb.com/api/json/v1/1/${path}Chicken`
		);
	});

	it('returns an empty array for an unknown filter value', async () => {
		globalThis.fetch = mockFetchOnce({ meals: null });
		await expect(filterByIngredient('unobtainium')).resolves.toEqual([]);
	});
});

describe('lookupRecipe', () => {
	it('returns the normalized recipe for a known id', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail()] });
		const recipe = await lookupRecipe('52772');
		expect(recipe?.id).toBe('52772');
		expect(recipe?.ingredients).toHaveLength(3);
	});

	it('returns null when the id does not exist (meals: null)', async () => {
		globalThis.fetch = mockFetchOnce({ meals: null });
		await expect(lookupRecipe('does-not-exist')).resolves.toBeNull();
	});

	it('returns null when the API returns an empty meals array', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [] });
		await expect(lookupRecipe('0')).resolves.toBeNull();
	});

	it('propagates a transport failure rather than swallowing it', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network down'));
		await expect(lookupRecipe('52772')).rejects.toThrow('network down');
	});
});

describe('list endpoints', () => {
	it('extracts category names', async () => {
		globalThis.fetch = mockFetchOnce({
			meals: [{ strCategory: 'Beef' }, { strCategory: 'Chicken' }]
		});
		await expect(listCategories()).resolves.toEqual(['Beef', 'Chicken']);
	});

	it('extracts area names', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [{ strArea: 'Italian' }, { strArea: 'Thai' }] });
		await expect(listAreas()).resolves.toEqual(['Italian', 'Thai']);
	});

	it('filters out blank and missing names', async () => {
		globalThis.fetch = mockFetchOnce({
			meals: [{ strCategory: 'Beef' }, { strCategory: '' }, {}, { strCategory: 'Pork' }]
		});
		await expect(listCategories()).resolves.toEqual(['Beef', 'Pork']);
	});

	it('returns an empty list rather than throwing when meals is null', async () => {
		globalThis.fetch = mockFetchOnce({ meals: null });
		await expect(listCategories()).resolves.toEqual([]);
		globalThis.fetch = mockFetchOnce({ meals: null });
		await expect(listAreas()).resolves.toEqual([]);
	});
});

describe('randomRecipe', () => {
	it('returns a normalized recipe', async () => {
		globalThis.fetch = mockFetchOnce({ meals: [rawDetail()] });
		const recipe = await randomRecipe();
		expect(recipe?.title).toBe('Teriyaki Chicken Casserole');
	});

	it('returns null when the API returns nothing', async () => {
		globalThis.fetch = mockFetchOnce({ meals: null });
		await expect(randomRecipe()).resolves.toBeNull();
	});
});
