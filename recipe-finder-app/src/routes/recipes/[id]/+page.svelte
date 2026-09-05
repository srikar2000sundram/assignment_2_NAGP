<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { lookupRecipe } from '$lib/api/mealdb';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { mealPlan } from '$lib/stores/mealPlan.svelte';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import { isVegetarianCategory } from '$lib/validation/diet';
	import { WEEKDAYS, WEEKDAY_LABELS, type Recipe, type Weekday } from '$lib/types/recipe';

	let recipe = $state<Recipe | null>(null);
	let loading = $state(true);
	let notFound = $state(false);
	let confirmingDelete = $state(false);
	let planPickerOpen = $state(false);

	/**
	 * Guards against out-of-order responses when the id changes quickly: a slow
	 * earlier lookup must not overwrite a newer one.
	 */
	let loadToken = 0;

	/** Which weekdays this recipe currently occupies, for the picker's labels. */
	let plannedDays = $derived(
		recipe ? WEEKDAYS.filter((day) => mealPlan.slots[day]?.id === recipe!.id) : []
	);

	/**
	 * Discovery and Add Recipe both already exclude non-vegetarian recipes
	 * (ADR-014), but this page is reachable by a direct URL to any TheMealDB
	 * id — including one discovery would never have surfaced — so favoriting
	 * and planning are gated here too rather than assumed safe.
	 */
	let isVegetarian = $derived(recipe ? isVegetarianCategory(recipe.category) : false);

	async function load(id: string) {
		const token = ++loadToken;
		loading = true;
		notFound = false;
		confirmingDelete = false;
		planPickerOpen = false;

		const userRecipe = userRecipes.get(id);
		if (userRecipe) {
			recipe = userRecipe;
			loading = false;
			return;
		}

		try {
			const fetched = await lookupRecipe(id);
			if (token !== loadToken) return;
			recipe = fetched;
			notFound = !fetched;
		} catch {
			if (token !== loadToken) return;
			recipe = null;
			notFound = true;
		} finally {
			if (token === loadToken) loading = false;
		}
	}

	$effect(() => {
		const id = page.params.id;
		if (id) load(id);
	});

	function handleFavoriteToggle() {
		if (!recipe || !isVegetarian) return;
		favorites.toggle({ id: recipe.id, source: recipe.source });
	}

	function handleDelete() {
		if (!recipe) return;
		userRecipes.remove(recipe.id);
		goto(resolve('/'));
	}

	function assignToDay(day: Weekday) {
		if (!recipe || !isVegetarian) return;
		// Overwrites whatever occupied that day, which is the same "modify a
		// planned meal" path the meal-plan page's slot control uses.
		mealPlan.assign(day, { id: recipe.id, source: recipe.source });
		planPickerOpen = false;
	}
</script>

{#if loading}
	<div class="recipe-hero">
		<div class="skeleton-card__media" style="border-radius: var(--ruik-radius-lg);"></div>
		<div style="display:flex; flex-direction:column; gap:12px; padding-top:8px;">
			<div class="skeleton-line skeleton-line--narrow" style="height:14px;"></div>
			<div class="skeleton-line skeleton-line--wide" style="height:28px;"></div>
			<div class="skeleton-line" style="width:55%;"></div>
		</div>
	</div>
{:else if notFound || !recipe}
	<div class="empty-state">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
			<path
				d="M9 11l6 6M15 11l-6 6"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
			/>
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
		</svg>
		<strong>Recipe not found</strong>
		<p>It may have been removed, or the link is incorrect.</p>
		<a class="btn btn--primary" href={resolve('/')}>Back to discovery</a>
	</div>
{:else}
	<article>
		<div class="recipe-hero">
			<div class="recipe-hero__media">
				{#if recipe.image}
					<img src={recipe.image} alt={recipe.title} />
				{/if}
			</div>
			<div class="recipe-hero__body">
				<div class="action-row">
					{#if recipe.category}
						<recipe-ui-rating-badge label={recipe.category} variant="info"></recipe-ui-rating-badge>
					{/if}
					{#if recipe.area}
						<recipe-ui-rating-badge label={recipe.area} variant="neutral"></recipe-ui-rating-badge>
					{/if}
				</div>

				<h1 class="recipe-hero__title">{recipe.title}</h1>

				<div class="action-row">
					{#if isVegetarian}
						<button
							class="btn"
							class:btn--primary={favorites.isFavorite(recipe.id)}
							onclick={handleFavoriteToggle}
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill={favorites.isFavorite(recipe.id) ? 'currentColor' : 'none'}
							>
								<path
									d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2.1 0 3.8 1.2 6 3.7C14.2 5.2 15.9 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linejoin="round"
								/>
							</svg>
							{favorites.isFavorite(recipe.id) ? 'Favorited' : 'Add to favorites'}
						</button>
						<button class="btn" onclick={() => (planPickerOpen = true)}>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none">
								<rect
									x="3"
									y="5"
									width="18"
									height="16"
									rx="2"
									stroke="currentColor"
									stroke-width="1.6"
								/>
								<path
									d="M8 3v4M16 3v4M3 10h18"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
								/>
							</svg>
							{plannedDays.length > 0 ? 'Planned' : 'Add to meal plan'}
						</button>
					{:else}
						<p class="diet-error-banner">
							This recipe isn't vegetarian, so it can't be favorited or added to your meal plan.
						</p>
					{/if}

					{#if recipe.source === 'user'}
						<a class="btn" href={resolve('/recipes/[id]/edit', { id: recipe.id })}>Edit</a>
						{#if confirmingDelete}
							<button class="btn btn--danger" onclick={handleDelete}>Confirm delete</button>
							<button class="btn" onclick={() => (confirmingDelete = false)}>Cancel</button>
						{:else}
							<button class="btn btn--danger" onclick={() => (confirmingDelete = true)}
								>Delete</button
							>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<div class="recipe-content">
			<div>
				<h2>Ingredients</h2>
				{#if recipe.ingredients.length > 0}
					<ul class="ingredient-list">
						{#each recipe.ingredients as ingredient, i (i)}
							<li><span>{ingredient.name}</span><span>{ingredient.measure}</span></li>
						{/each}
					</ul>
				{:else}
					<p>No ingredients listed.</p>
				{/if}
			</div>
			<div>
				<h2>Instructions</h2>
				<p class="instructions">{recipe.instructions || 'No instructions provided.'}</p>
			</div>
		</div>
	</article>

	<recipe-ui-modal-dialog
		open={planPickerOpen}
		heading="Add “{recipe.title}” to a day"
		onclose={() => (planPickerOpen = false)}
	>
		<div class="day-picker">
			{#each WEEKDAYS as day (day)}
				{@const occupant = mealPlan.slots[day]}
				<button
					class="day-picker__day"
					class:day-picker__day--taken={occupant}
					onclick={() => assignToDay(day)}
				>
					<span>{WEEKDAY_LABELS[day]}</span>
					{#if occupant?.id === recipe.id}
						<span class="day-picker__current">This recipe</span>
					{:else if occupant}
						<span class="day-picker__current">Replace</span>
					{/if}
				</button>
			{/each}
		</div>
	</recipe-ui-modal-dialog>
{/if}
