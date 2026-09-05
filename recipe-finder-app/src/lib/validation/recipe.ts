/**
 * Route-level validation for the Recipe Management requirement
 * ("validate recipe input before saving"). Deliberately lives here, not
 * inside <recipe-ui-form>, per docs/decisions.md ADR-006 — the Stencil form
 * only collects input, this app owns the business rules. Rules mirror
 * docs/data-model.md#user-recipes-store.
 */
import type { RecipeFormValue, RecipeFormErrors } from '@srikar_sundram/recipe-ui-kit';

export function validateRecipeForm(value: RecipeFormValue): RecipeFormErrors {
	const errors: RecipeFormErrors = {};

	const title = value.title.trim();
	if (!title) {
		errors.title = 'Title is required.';
	} else if (title.length > 120) {
		errors.title = 'Title must be 120 characters or fewer.';
	}

	const hasIngredient = value.ingredients.some((i) => i.name.trim().length > 0);
	if (!hasIngredient) {
		errors.ingredients = 'Add at least one ingredient.';
	}

	if (!value.instructions.trim()) {
		errors.instructions = 'Instructions are required.';
	}

	return errors;
}

export function isRecipeFormValid(errors: RecipeFormErrors): boolean {
	return Object.keys(errors).length === 0;
}
