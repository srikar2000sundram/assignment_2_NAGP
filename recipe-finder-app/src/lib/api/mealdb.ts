/**
 * TheMealDB client. Every export here returns this app's normalized `Recipe`
 * type (docs/data-model.md) — nothing outside this file should ever see
 * TheMealDB's raw `strIngredient1..20` shape. See docs/api.md for the
 * endpoint reference this was built against.
 */
import type { Recipe, RecipeIngredient } from '$lib/types/recipe';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

interface MealDbMealSummary {
	idMeal: string;
	strMeal: string;
	strMealThumb: string | null;
}

interface MealDbMealDetail {
	idMeal: string;
	strMeal: string;
	strMealThumb: string | null;
	strCategory: string | null;
	strArea: string | null;
	strInstructions: string | null;
	strTags: string | null;
	// strIngredient1..20 / strMeasure1..20, accessed dynamically below.
	[key: string]: string | null | undefined;
}

interface MealDbListResponse<T> {
	meals: T[] | null;
}

interface MealDbNameEntry {
	strCategory?: string;
	strArea?: string;
}

function normalizeIngredients(meal: MealDbMealDetail): RecipeIngredient[] {
	const ingredients: RecipeIngredient[] = [];
	for (let i = 1; i <= 20; i++) {
		const name = meal[`strIngredient${i}`];
		if (name && name.trim()) {
			const measure = meal[`strMeasure${i}`] ?? '';
			ingredients.push({ name: name.trim(), measure: measure.trim() });
		}
	}
	return ingredients;
}

function toSummary(meal: MealDbMealSummary): Recipe {
	return {
		id: meal.idMeal,
		source: 'api',
		title: meal.strMeal,
		image: meal.strMealThumb,
		category: null,
		area: null,
		ingredients: [],
		instructions: '',
		tags: [],
		createdAt: null,
		updatedAt: null
	};
}

function toDetail(meal: MealDbMealDetail): Recipe {
	return {
		id: meal.idMeal,
		source: 'api',
		title: meal.strMeal,
		image: meal.strMealThumb,
		category: meal.strCategory,
		area: meal.strArea,
		ingredients: normalizeIngredients(meal),
		instructions: meal.strInstructions ?? '',
		tags: meal.strTags
			? meal.strTags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [],
		createdAt: null,
		updatedAt: null
	};
}

async function getJson<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE_URL}/${path}`);
	if (!res.ok) {
		throw new Error(`TheMealDB request failed: ${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<T>;
}

/** search.php?s= — name search, returns full detail per match. */
export async function searchRecipes(query: string): Promise<Recipe[]> {
	const data = await getJson<MealDbListResponse<MealDbMealDetail>>(
		`search.php?s=${encodeURIComponent(query)}`
	);
	return (data.meals ?? []).map(toDetail);
}

/** filter.php?c= — category filter, summary only (no ingredients/instructions). */
export async function filterByCategory(category: string): Promise<Recipe[]> {
	const data = await getJson<MealDbListResponse<MealDbMealSummary>>(
		`filter.php?c=${encodeURIComponent(category)}`
	);
	return (data.meals ?? []).map(toSummary);
}

/** filter.php?a= — cuisine/area filter, summary only. */
export async function filterByArea(area: string): Promise<Recipe[]> {
	const data = await getJson<MealDbListResponse<MealDbMealSummary>>(
		`filter.php?a=${encodeURIComponent(area)}`
	);
	return (data.meals ?? []).map(toSummary);
}

/** filter.php?i= — main-ingredient filter, summary only. */
export async function filterByIngredient(ingredient: string): Promise<Recipe[]> {
	const data = await getJson<MealDbListResponse<MealDbMealSummary>>(
		`filter.php?i=${encodeURIComponent(ingredient)}`
	);
	return (data.meals ?? []).map(toSummary);
}

/** lookup.php?i= — full detail by id. Returns null if the id doesn't exist. */
export async function lookupRecipe(id: string): Promise<Recipe | null> {
	const data = await getJson<MealDbListResponse<MealDbMealDetail>>(
		`lookup.php?i=${encodeURIComponent(id)}`
	);
	const meal = data.meals?.[0];
	return meal ? toDetail(meal) : null;
}

/** list.php?c=list — all category names, for populating filter chip options. */
export async function listCategories(): Promise<string[]> {
	const data = await getJson<MealDbListResponse<MealDbNameEntry>>('list.php?c=list');
	return (data.meals ?? []).map((m) => m.strCategory).filter((c): c is string => Boolean(c));
}

/** list.php?a=list — all area/cuisine names, for populating filter chip options. */
export async function listAreas(): Promise<string[]> {
	const data = await getJson<MealDbListResponse<MealDbNameEntry>>('list.php?a=list');
	return (data.meals ?? []).map((m) => m.strArea).filter((a): a is string => Boolean(a));
}

/** random.php — one random recipe, full detail. */
export async function randomRecipe(): Promise<Recipe | null> {
	const data = await getJson<MealDbListResponse<MealDbMealDetail>>('random.php');
	const meal = data.meals?.[0];
	return meal ? toDetail(meal) : null;
}
