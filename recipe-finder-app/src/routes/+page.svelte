<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		searchRecipes,
		filterByCategory,
		filterByArea,
		filterByIngredient,
		listAreas
	} from '$lib/api/mealdb';
	import { composeResults, unionAxis, type RecipeAxis } from '$lib/search/compose';
	import { COMMON_INGREDIENTS } from '$lib/search/ingredients';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import type { Recipe } from '$lib/types/recipe';
	import type { FilterOption } from '@srikar_sundram/recipe-ui-kit';

	/**
	 * This app only ever shows vegetarian/vegan recipes — see
	 * docs/decisions.md ADR-014. This axis is fetched and intersected on
	 * every query unconditionally, not gated behind any user selection, so
	 * it can never be "cleared" the way the other filter axes can.
	 */
	const VEGETARIAN_DIET_VALUES = ['Vegetarian', 'Vegan'];

	let query = $state('');
	let selectedAreas = $state<string[]>([]);
	let selectedIngredients = $state<string[]>([]);
	let areaOptions = $state<FilterOption[]>([]);
	const ingredientOptions = COMMON_INGREDIENTS;

	let results = $state<Recipe[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Guards against out-of-order responses: a slow earlier query must never
	 * overwrite the results of a newer one. Every run captures the token it
	 * started with and bails on write if a newer run has since begun.
	 */
	let queryToken = 0;

	let activeFilterCount = $derived(selectedAreas.length + selectedIngredients.length);
	let hasAnyConstraint = $derived(query.trim().length > 0 || activeFilterCount > 0);

	async function loadFilterOptions() {
		try {
			const areas = await listAreas();
			areaOptions = areas.map((a) => ({ value: a, label: a }));
		} catch {
			// Non-critical: search/browse still work without filter chips populated.
		}
	}

	/** Fetch one filter axis: every selection in parallel, unioned into one list. */
	async function fetchAxis(
		name: string,
		selections: string[],
		fetcher: (value: string) => Promise<Recipe[]>
	): Promise<RecipeAxis> {
		const groups = await Promise.all(selections.map(fetcher));
		return { name, recipes: unionAxis(groups) };
	}

	async function runQuery() {
		const token = ++queryToken;
		loading = true;
		error = null;

		try {
			const term = query.trim();

			// The vegetarian/vegan axis is pushed unconditionally, on every
			// query — this app never shows a non-vegetarian recipe (ADR-014).
			// Every other axis is only fetched, and only handed to
			// composeResults(), when the user has actually selected something:
			// an omitted axis means "unconstrained", whereas an axis that is
			// present but matched nothing correctly empties the result.
			const axisRequests: Promise<RecipeAxis>[] = [
				fetchAxis('diet', VEGETARIAN_DIET_VALUES, filterByCategory)
			];
			if (selectedAreas.length > 0) {
				axisRequests.push(fetchAxis('area', selectedAreas, filterByArea));
			}
			if (selectedIngredients.length > 0) {
				axisRequests.push(fetchAxis('ingredient', selectedIngredients, filterByIngredient));
			}

			const [searchResults, axes] = await Promise.all([
				term ? searchRecipes(term) : Promise.resolve(null),
				Promise.all(axisRequests)
			]);

			// composeResults() only ever falls back to the browse set when no
			// axis is active at all — with the diet axis always present, that
			// never happens here, so there is no separate browse fetch to make.
			if (token !== queryToken) return;
			results = composeResults({ searchResults, axes, browseResults: [] });
		} catch {
			if (token !== queryToken) return;
			error = 'Could not reach the recipe API. Please try again.';
			results = [];
		} finally {
			if (token === queryToken) loading = false;
		}
	}

	onMount(() => {
		loadFilterOptions();
		runQuery();
	});

	function handleSearchChange(ev: CustomEvent<{ value: string }>) {
		query = ev.detail.value;
		runQuery();
	}

	function handleAreaFilterChange(ev: CustomEvent<{ selected: string[] }>) {
		selectedAreas = ev.detail.selected;
		runQuery();
	}

	function handleIngredientFilterChange(ev: CustomEvent<{ selected: string[] }>) {
		selectedIngredients = ev.detail.selected;
		runQuery();
	}

	function clearAll() {
		query = '';
		selectedAreas = [];
		selectedIngredients = [];
		runQuery();
	}

	function handleCardClick(ev: CustomEvent<{ recipeId: string }>) {
		goto(resolve('/recipes/[id]', { id: ev.detail.recipeId }));
	}

	function favoriteToggleHandler(source: 'api' | 'user') {
		return (ev: CustomEvent<{ recipeId: string }>) => {
			favorites.toggle({ id: ev.detail.recipeId, source });
		};
	}

	/**
	 * Slotted card actions render inside the card's shadow `.card` element,
	 * which carries its own click handler — so without stopPropagation these
	 * would also fire cardClick and navigate to the detail page.
	 */
	function editUserRecipe(ev: MouseEvent, id: string) {
		ev.stopPropagation();
		goto(resolve('/recipes/[id]/edit', { id }));
	}

	let pendingDeleteId = $state<string | null>(null);

	function askDelete(ev: MouseEvent, id: string) {
		ev.stopPropagation();
		pendingDeleteId = id;
	}

	function cancelDelete(ev: MouseEvent) {
		ev.stopPropagation();
		pendingDeleteId = null;
	}

	function confirmDelete(ev: MouseEvent, id: string) {
		ev.stopPropagation();
		userRecipes.remove(id);
		pendingDeleteId = null;
	}
</script>

<div class="page-header">
	<span class="eyebrow">Recipe Finder</span>
	<h1>What are we cooking today?</h1>
	<p>
		Search thousands of vegetarian recipes, save your favorites, and plan the week ahead.
		<span class="diet-note">Showing vegetarian &amp; vegan recipes only.</span>
	</p>
	<div class="filters-row">
		<recipe-ui-search-bar
			value={query}
			placeholder="Search by name — “teriyaki”, “pancakes”…"
			onsearchChange={handleSearchChange}
		></recipe-ui-search-bar>

		{#if areaOptions.length > 0}
			<div class="filter-axis">
				<span class="filter-axis__label">Cuisine</span>
				<recipe-ui-filter-chip-group
					options={areaOptions}
					selected={selectedAreas}
					onfilterChange={handleAreaFilterChange}
				></recipe-ui-filter-chip-group>
			</div>
		{/if}

		<div class="filter-axis">
			<span class="filter-axis__label">Main ingredient</span>
			<recipe-ui-filter-chip-group
				options={ingredientOptions}
				selected={selectedIngredients}
				onfilterChange={handleIngredientFilterChange}
			></recipe-ui-filter-chip-group>
		</div>

		{#if hasAnyConstraint}
			<div class="filter-summary">
				<span>
					{#if query.trim()}
						Searching “{query.trim()}”{activeFilterCount > 0 ? ' within' : ''}
					{/if}
					{#if activeFilterCount > 0}
						{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
					{/if}
				</span>
				<button class="btn btn--subtle" onclick={clearAll}>Clear all</button>
			</div>
		{/if}
	</div>
</div>

{#if userRecipes.all.length > 0}
	<section>
		<div class="section-heading">
			<h2>Your Recipes</h2>
			<span class="section-count">{userRecipes.all.length}</span>
		</div>
		<div class="recipe-grid">
			{#each userRecipes.all as recipe (recipe.id)}
				<recipe-ui-card
					recipeId={recipe.id}
					recipeTitle={recipe.title}
					image={recipe.image ?? undefined}
					category={recipe.category ?? undefined}
					isFavorite={favorites.isFavorite(recipe.id)}
					oncardClick={handleCardClick}
					onfavoriteToggle={favoriteToggleHandler('user')}
				>
					<!-- Projected into recipe-ui-card's footer slot. -->
					{#if pendingDeleteId === recipe.id}
						<button class="btn btn--danger btn--tiny" onclick={(e) => confirmDelete(e, recipe.id)}>
							Confirm
						</button>
						<button class="btn btn--tiny" onclick={cancelDelete}>Cancel</button>
					{:else}
						<button class="btn btn--tiny" onclick={(e) => editUserRecipe(e, recipe.id)}>Edit</button
						>
						<button class="btn btn--tiny btn--danger-text" onclick={(e) => askDelete(e, recipe.id)}>
							Delete
						</button>
					{/if}
				</recipe-ui-card>
			{/each}
		</div>
	</section>
{/if}

<section>
	<div class="section-heading">
		<h2>{hasAnyConstraint ? 'Results' : 'Browse'}</h2>
		{#if !loading && !error}
			<span class="section-count">{results.length} recipe{results.length === 1 ? '' : 's'}</span>
		{/if}
	</div>
	{#if loading}
		<div class="skeleton-grid">
			{#each Array.from({ length: 8 }, (_, i) => i) as i (i)}
				<div class="skeleton-card">
					<div class="skeleton-card__media"></div>
					<div class="skeleton-card__body">
						<div class="skeleton-line skeleton-line--wide"></div>
						<div class="skeleton-line skeleton-line--narrow"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="empty-state">
			<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
				<path
					d="M12 8v5M12 16h.01"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
				<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
			</svg>
			<strong>Something went wrong</strong>
			<p>{error}</p>
			<button class="btn btn--primary" onclick={runQuery}>Try again</button>
		</div>
	{:else if results.length === 0}
		<div class="empty-state">
			<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
				<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6" />
				<path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
			</svg>
			<strong>No recipes found</strong>
			<p>
				{#if activeFilterCount > 1 || (query.trim() && activeFilterCount > 0)}
					Nothing matches all of those at once. Try removing a filter.
				{:else}
					Try a different search term or clear your filters.
				{/if}
			</p>
			{#if hasAnyConstraint}
				<button class="btn btn--primary" onclick={clearAll}>Clear all</button>
			{/if}
		</div>
	{:else}
		<div class="recipe-grid">
			{#each results as recipe (recipe.id)}
				<recipe-ui-card
					recipeId={recipe.id}
					recipeTitle={recipe.title}
					image={recipe.image ?? undefined}
					category={recipe.category ?? undefined}
					isFavorite={favorites.isFavorite(recipe.id)}
					oncardClick={handleCardClick}
					onfavoriteToggle={favoriteToggleHandler('api')}
				></recipe-ui-card>
			{/each}
		</div>
	{/if}
</section>
