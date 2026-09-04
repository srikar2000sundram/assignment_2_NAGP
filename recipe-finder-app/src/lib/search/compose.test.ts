import { describe, it, expect } from 'vitest';
import { composeResults, intersectAxes, mergePreferDetail, unionAxis } from './compose';
import type { Recipe } from '$lib/types/recipe';

/** A `filter.php`-shaped record: id/title/image only, no detail fields. */
function summary(id: string, title = `Recipe ${id}`): Recipe {
	return {
		id,
		source: 'api',
		title,
		image: `https://img/${id}.png`,
		category: null,
		area: null,
		ingredients: [],
		instructions: '',
		tags: [],
		createdAt: null,
		updatedAt: null
	};
}

/** A `search.php`/`lookup.php`-shaped record, carrying detail fields. */
function detail(id: string, title = `Recipe ${id}`): Recipe {
	return {
		...summary(id, title),
		category: 'Chicken',
		area: 'Japanese',
		ingredients: [{ name: 'Chicken', measure: '500g' }],
		instructions: 'Cook it.'
	};
}

describe('mergePreferDetail', () => {
	it('dedupes by id', () => {
		expect(mergePreferDetail([summary('1'), summary('1'), summary('2')]).map((r) => r.id)).toEqual([
			'1',
			'2'
		]);
	});

	it('upgrades a summary to the detailed record for the same id', () => {
		const merged = mergePreferDetail([summary('1')], [detail('1')]);
		expect(merged).toHaveLength(1);
		expect(merged[0].category).toBe('Chicken');
	});

	it('never downgrades a detailed record back to a summary', () => {
		const merged = mergePreferDetail([detail('1')], [summary('1')]);
		expect(merged[0].category).toBe('Chicken');
		expect(merged[0].ingredients).toHaveLength(1);
	});

	it('preserves first-appearance order across groups', () => {
		const merged = mergePreferDetail([summary('3'), summary('1')], [summary('2'), summary('3')]);
		expect(merged.map((r) => r.id)).toEqual(['3', '1', '2']);
	});

	it('returns an empty list for no input', () => {
		expect(mergePreferDetail()).toEqual([]);
		expect(mergePreferDetail([], [])).toEqual([]);
	});
});

describe('unionAxis', () => {
	it('unions every selection within one axis', () => {
		const union = unionAxis([
			[summary('1'), summary('2')],
			[summary('2'), summary('3')]
		]);
		expect(union.map((r) => r.id)).toEqual(['1', '2', '3']);
	});

	it('is empty when no selection matched anything', () => {
		expect(unionAxis([[], []])).toEqual([]);
	});
});

describe('intersectAxes', () => {
	it('returns an empty list when given no axes at all', () => {
		// "No constraints" is the caller's signal to fall back to browse, so an
		// empty axis list here must not be mistaken for a real result.
		expect(intersectAxes([])).toEqual([]);
	});

	it('passes a single axis through unchanged', () => {
		const axis = { name: 'category', recipes: [summary('1'), summary('2')] };
		expect(intersectAxes([axis]).map((r) => r.id)).toEqual(['1', '2']);
	});

	it('keeps only ids present in every axis', () => {
		const result = intersectAxes([
			{ name: 'category', recipes: [summary('1'), summary('2'), summary('3')] },
			{ name: 'area', recipes: [summary('2'), summary('3'), summary('4')] },
			{ name: 'ingredient', recipes: [summary('3'), summary('2')] }
		]);
		expect(result.map((r) => r.id)).toEqual(['2', '3']);
	});

	it('empties the result when one active axis matched nothing', () => {
		const result = intersectAxes([
			{ name: 'category', recipes: [summary('1'), summary('2')] },
			{ name: 'area', recipes: [] }
		]);
		expect(result).toEqual([]);
	});

	it('is empty when the axes have no ids in common', () => {
		const result = intersectAxes([
			{ name: 'category', recipes: [summary('1')] },
			{ name: 'area', recipes: [summary('2')] }
		]);
		expect(result).toEqual([]);
	});

	it('orders by the first axis regardless of axis sizes', () => {
		const result = intersectAxes([
			{ name: 'first', recipes: [summary('3'), summary('1'), summary('2')] },
			{ name: 'second', recipes: [summary('1'), summary('2'), summary('3')] }
		]);
		expect(result.map((r) => r.id)).toEqual(['3', '1', '2']);
	});

	it('carries detail from a later axis onto a survivor that arrived as a summary', () => {
		// This is why intersecting does not strip category badges off cards: the
		// filter axis contributes the id, the search axis contributes the detail.
		const result = intersectAxes([
			{ name: 'category', recipes: [summary('1')] },
			{ name: 'search', recipes: [detail('1')] }
		]);
		expect(result).toHaveLength(1);
		expect(result[0].category).toBe('Chicken');
	});
});

describe('composeResults', () => {
	const browseResults = [summary('b1'), summary('b2')];

	it('falls back to the browse set when nothing is active', () => {
		expect(composeResults({ searchResults: null, axes: [], browseResults })).toEqual(browseResults);
	});

	it('returns the search results when only a search term is active', () => {
		const searchResults = [detail('1'), detail('2')];
		expect(composeResults({ searchResults, axes: [], browseResults }).map((r) => r.id)).toEqual([
			'1',
			'2'
		]);
	});

	it('returns the filter results when only filters are active', () => {
		const axes = [{ name: 'category', recipes: [summary('7')] }];
		expect(composeResults({ searchResults: null, axes, browseResults }).map((r) => r.id)).toEqual([
			'7'
		]);
	});

	it('intersects a search term with the active filters instead of overriding them', () => {
		// The core behaviour change: previously a search term discarded the filters.
		const searchResults = [detail('1'), detail('2'), detail('3')];
		const axes = [
			{ name: 'category', recipes: [summary('2'), summary('3'), summary('9')] },
			{ name: 'area', recipes: [summary('3'), summary('2')] }
		];

		const result = composeResults({ searchResults, axes, browseResults });

		expect(result.map((r) => r.id)).toEqual(['2', '3']);
	});

	it('yields nothing when the search term and the filters do not overlap', () => {
		const result = composeResults({
			searchResults: [detail('1')],
			axes: [{ name: 'category', recipes: [summary('2')] }],
			browseResults
		});
		expect(result).toEqual([]);
	});

	it('distinguishes an empty search result from no search at all', () => {
		// A search that matched nothing must show nothing — not the browse set.
		expect(composeResults({ searchResults: [], axes: [], browseResults })).toEqual([]);
		expect(composeResults({ searchResults: null, axes: [], browseResults })).toEqual(browseResults);
	});

	it('ignores the browse set entirely once anything is active', () => {
		const result = composeResults({
			searchResults: [detail('1')],
			axes: [],
			browseResults
		});
		expect(result.map((r) => r.id)).toEqual(['1']);
	});
});
