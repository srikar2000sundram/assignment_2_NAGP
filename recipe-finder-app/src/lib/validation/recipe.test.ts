import { describe, it, expect } from 'vitest';
import { validateRecipeForm, isRecipeFormValid } from './recipe';
import type { RecipeFormValue } from '@srikar_sundram/recipe-ui-kit';

function form(overrides: Partial<RecipeFormValue> = {}): RecipeFormValue {
	return {
		title: 'Teriyaki Chicken',
		image: null,
		category: null,
		instructions: 'Cook it.',
		ingredients: [{ name: 'Chicken', measure: '500g' }],
		...overrides
	};
}

describe('validateRecipeForm — title', () => {
	it('accepts a normal title', () => {
		expect(validateRecipeForm(form()).title).toBeUndefined();
	});

	it('rejects an empty title', () => {
		expect(validateRecipeForm(form({ title: '' })).title).toBe('Title is required.');
	});

	it('rejects a whitespace-only title', () => {
		// The browser's `required` attribute would accept "   ", so this rule is
		// the one that actually catches it.
		expect(validateRecipeForm(form({ title: '   \t\n ' })).title).toBe('Title is required.');
	});

	it('accepts a title at exactly the 120-character limit', () => {
		expect(validateRecipeForm(form({ title: 'a'.repeat(120) })).title).toBeUndefined();
	});

	it('accepts a title one character under the limit', () => {
		expect(validateRecipeForm(form({ title: 'a'.repeat(119) })).title).toBeUndefined();
	});

	it('rejects a title one character over the limit', () => {
		expect(validateRecipeForm(form({ title: 'a'.repeat(121) })).title).toBe(
			'Title must be 120 characters or fewer.'
		);
	});

	it('measures the trimmed length, so surrounding spaces do not push it over', () => {
		const padded = `  ${'a'.repeat(120)}  `;
		expect(validateRecipeForm(form({ title: padded })).title).toBeUndefined();
	});
});

describe('validateRecipeForm — ingredients', () => {
	it('accepts at least one named ingredient', () => {
		expect(validateRecipeForm(form()).ingredients).toBeUndefined();
	});

	it('rejects an empty ingredient list', () => {
		expect(validateRecipeForm(form({ ingredients: [] })).ingredients).toBe(
			'Add at least one ingredient.'
		);
	});

	it('rejects rows that have a measure but no name', () => {
		expect(
			validateRecipeForm(form({ ingredients: [{ name: '', measure: '2 tbsp' }] })).ingredients
		).toBe('Add at least one ingredient.');
	});

	it('rejects whitespace-only ingredient names', () => {
		expect(
			validateRecipeForm(form({ ingredients: [{ name: '   ', measure: '' }] })).ingredients
		).toBe('Add at least one ingredient.');
	});

	it('accepts a named ingredient with no measure', () => {
		expect(
			validateRecipeForm(form({ ingredients: [{ name: 'Salt', measure: '' }] })).ingredients
		).toBeUndefined();
	});

	it('accepts a mix where only some rows are named', () => {
		expect(
			validateRecipeForm(
				form({
					ingredients: [
						{ name: '', measure: '' },
						{ name: 'Salt', measure: 'a pinch' }
					]
				})
			).ingredients
		).toBeUndefined();
	});
});

describe('validateRecipeForm — instructions', () => {
	it('rejects empty instructions', () => {
		expect(validateRecipeForm(form({ instructions: '' })).instructions).toBe(
			'Instructions are required.'
		);
	});

	it('rejects whitespace-only instructions', () => {
		expect(validateRecipeForm(form({ instructions: ' \n\t ' })).instructions).toBe(
			'Instructions are required.'
		);
	});

	it('accepts any non-blank instructions', () => {
		expect(validateRecipeForm(form({ instructions: 'Mix.' })).instructions).toBeUndefined();
	});
});

describe('validateRecipeForm — combined', () => {
	it('returns no errors for a fully valid recipe', () => {
		expect(validateRecipeForm(form())).toEqual({});
	});

	it('reports every failing field at once rather than stopping at the first', () => {
		const errors = validateRecipeForm(form({ title: '', ingredients: [], instructions: '' }));
		expect(Object.keys(errors).sort()).toEqual(['ingredients', 'instructions', 'title']);
	});

	it('does not validate optional image/category fields', () => {
		expect(validateRecipeForm(form({ image: 'not-a-url', category: '' }))).toEqual({});
	});
});

describe('isRecipeFormValid', () => {
	it('is true for no errors', () => {
		expect(isRecipeFormValid({})).toBe(true);
	});

	it('is false when any field has an error', () => {
		expect(isRecipeFormValid({ title: 'Title is required.' })).toBe(false);
	});

	it('agrees with validateRecipeForm on a valid form', () => {
		expect(isRecipeFormValid(validateRecipeForm(form()))).toBe(true);
	});

	it('agrees with validateRecipeForm on an invalid form', () => {
		expect(isRecipeFormValid(validateRecipeForm(form({ title: '' })))).toBe(false);
	});
});
