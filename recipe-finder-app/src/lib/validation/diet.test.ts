import { describe, it, expect } from 'vitest';
import { isVegetarianCategory } from './diet';

describe('isVegetarianCategory', () => {
	it('accepts Vegetarian and Vegan', () => {
		expect(isVegetarianCategory('Vegetarian')).toBe(true);
		expect(isVegetarianCategory('Vegan')).toBe(true);
	});

	it('is case-insensitive', () => {
		expect(isVegetarianCategory('VEGETARIAN')).toBe(true);
		expect(isVegetarianCategory('vegan')).toBe(true);
		expect(isVegetarianCategory('VeGaN')).toBe(true);
	});

	it('trims surrounding whitespace', () => {
		expect(isVegetarianCategory('  Vegetarian  ')).toBe(true);
	});

	it('rejects meat/fish/poultry categories', () => {
		for (const c of ['Chicken', 'Beef', 'Pork', 'Lamb', 'Seafood', 'Goat']) {
			expect(isVegetarianCategory(c)).toBe(false);
		}
	});

	it('rejects a category that only contains the word as a substring', () => {
		// Must match the whole category, not just "contain" vegetarian/vegan —
		// guards against a future TheMealDB category like "Vegetarian Sides"
		// being silently treated as safe.
		expect(isVegetarianCategory('Vegetarian Sides')).toBe(false);
	});

	it('rejects null, undefined, and empty string', () => {
		expect(isVegetarianCategory(null)).toBe(false);
		expect(isVegetarianCategory(undefined)).toBe(false);
		expect(isVegetarianCategory('')).toBe(false);
		expect(isVegetarianCategory('   ')).toBe(false);
	});
});
