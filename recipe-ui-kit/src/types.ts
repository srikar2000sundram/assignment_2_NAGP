/**
 * Shared, framework-agnostic types used across recipe-ui-kit's public component
 * props/events. Consumers (e.g. the SvelteKit app) import these as types only:
 *
 *   import type { FilterOption, RecipeFormValue } from '@srikar_sundram/recipe-ui-kit';
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface RecipeIngredient {
  name: string;
  measure: string;
}

/** Shape emitted by <recipe-ui-form>'s `submit` event and accepted as `initialValue`. */
export interface RecipeFormValue {
  title: string;
  image: string | null;
  category: string | null;
  instructions: string;
  ingredients: RecipeIngredient[];
}

/** Field-level validation errors the host app can feed back into <recipe-ui-form>. */
export type RecipeFormErrors = Partial<Record<'title' | 'ingredients' | 'instructions', string>>;

/** Minimal recipe summary rendered inside a filled <recipe-ui-meal-slot>. */
export interface MealSlotRecipe {
  id: string;
  title: string;
  image?: string;
}

export type RatingBadgeVariant = 'neutral' | 'success' | 'warning' | 'info';
