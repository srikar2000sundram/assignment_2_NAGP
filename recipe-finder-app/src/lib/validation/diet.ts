/**
 * The single definition of "vegetarian" this app uses, applied everywhere a
 * recipe is shown or accepted: TheMealDB discovery results, user-created
 * recipes, and previously-saved favorites/meal-plan entries.
 *
 * TheMealDB has no per-recipe boolean for this — the closest reliable signal
 * is its own `strCategory` field, which includes exactly two diet
 * categories: "Vegetarian" and "Vegan". Rather than guess from ingredient
 * names (unreliable — "coconut milk" isn't dairy, "fish sauce" isn't always
 * named "fish"), the app treats category membership as the definition, and
 * applies the same rule to user-created recipes by requiring their free-text
 * `category` field to be one of these two values. See docs/decisions.md
 * ADR-014.
 */
const VEGETARIAN_CATEGORIES = ['vegetarian', 'vegan'];

/** True if `category` is "Vegetarian" or "Vegan" (case- and whitespace-insensitive). */
export function isVegetarianCategory(category: string | null | undefined): boolean {
	if (!category) return false;
	return VEGETARIAN_CATEGORIES.includes(category.trim().toLowerCase());
}

/** Message shown when a user-created recipe's category fails the check. */
export const NON_VEGETARIAN_CATEGORY_MESSAGE =
	'This app only accepts vegetarian recipes. Set Category to "Vegetarian" or "Vegan".';
