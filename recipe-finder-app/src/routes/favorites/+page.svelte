<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { lookupRecipe } from '$lib/api/mealdb';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import { isVegetarianCategory } from '$lib/validation/diet';
	import type { Recipe, RecipeRef } from '$lib/types/recipe';

	let resolved = $state<Recipe[]>([]);
	let loading = $state(true);

	/**
	 * Favorites resolve through per-recipe API lookups, so two overlapping runs
	 * (unfavorite something while the previous resolve is still in flight) can
	 * finish out of order. Each run captures a token and refuses to write if a
	 * newer run has started.
	 */
	let resolveToken = 0;

	async function resolveFavorites(refs: RecipeRef[]) {
		const token = ++resolveToken;
		loading = true;
		const recipes = await Promise.all(
			refs.map(async (ref) => {
				if (ref.source === 'user') {
					return userRecipes.get(ref.id) ?? null;
				}
				try {
					return await lookupRecipe(ref.id);
				} catch {
					return null;
				}
			})
		);
		if (token !== resolveToken) return;
		// Discovery and Add Recipe both already enforce vegetarian-only
		// (ADR-014), so this only matters for a favorite saved before that
		// restriction existed. Hidden here rather than deleted — this page
		// doesn't own the favorites store's data, only its display.
		resolved = recipes.filter((r): r is Recipe => r !== null && isVegetarianCategory(r.category));
		loading = false;
	}

	$effect(() => {
		// favorites.ids is read here (as an argument) so this effect re-runs
		// whenever the set of favorite ids changes.
		resolveFavorites(favorites.ids);
	});

	function handleCardClick(ev: CustomEvent<{ recipeId: string }>) {
		goto(resolve('/recipes/[id]', { id: ev.detail.recipeId }));
	}

	function handleFavoriteToggle(ev: CustomEvent<{ recipeId: string }>) {
		favorites.remove(ev.detail.recipeId);
	}
</script>

<div class="page-header">
	<span class="eyebrow">Saved</span>
	<h1>Your Favorites</h1>
	<p>Recipes you've saved, ready to add to a meal plan.</p>
</div>

{#if loading}
	<div class="skeleton-grid">
		{#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
			<div class="skeleton-card">
				<div class="skeleton-card__media"></div>
				<div class="skeleton-card__body">
					<div class="skeleton-line skeleton-line--wide"></div>
					<div class="skeleton-line skeleton-line--narrow"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if resolved.length === 0}
	<div class="empty-state">
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
			<path
				d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2.1 0 3.8 1.2 6 3.7C14.2 5.2 15.9 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linejoin="round"
			/>
		</svg>
		<strong>No favorites yet</strong>
		<p>Tap the heart on any recipe to save it here.</p>
		<a class="btn btn--primary" href={resolve('/')}>Discover recipes</a>
	</div>
{:else}
	<div class="recipe-grid">
		{#each resolved as recipe (recipe.id)}
			<recipe-ui-card
				recipeId={recipe.id}
				recipeTitle={recipe.title}
				image={recipe.image ?? undefined}
				category={recipe.category ?? undefined}
				isFavorite={true}
				oncardClick={handleCardClick}
				onfavoriteToggle={handleFavoriteToggle}
			></recipe-ui-card>
		{/each}
	</div>
{/if}
