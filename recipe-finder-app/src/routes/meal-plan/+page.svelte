<script lang="ts">
	import { lookupRecipe } from '$lib/api/mealdb';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { mealPlan } from '$lib/stores/mealPlan.svelte';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import { isVegetarianCategory } from '$lib/validation/diet';
	import {
		WEEKDAYS,
		WEEKDAY_LABELS,
		type Weekday,
		type Recipe,
		type RecipeRef
	} from '$lib/types/recipe';
	import type { MealSlotRecipe } from '@srikar_sundram/recipe-ui-kit';

	let resolvedSlots = $state<Record<Weekday, MealSlotRecipe | null>>(
		WEEKDAYS.reduce(
			(acc, day) => {
				acc[day] = null;
				return acc;
			},
			{} as Record<Weekday, MealSlotRecipe | null>
		)
	);

	let pickerOpen = $state(false);
	let activeDay = $state<Weekday | null>(null);
	let pickerOptions = $state<Recipe[]>([]);

	/** See favorites/+page.svelte — same out-of-order-response guard. */
	let slotsToken = 0;
	let pickerToken = 0;

	async function resolveSlots(slots: Record<Weekday, RecipeRef | null>) {
		const token = ++slotsToken;
		const entries = await Promise.all(
			WEEKDAYS.map(async (day) => {
				const ref = slots[day];
				if (!ref) return [day, null] as const;
				const recipe =
					ref.source === 'user'
						? userRecipes.get(ref.id)
						: await lookupRecipe(ref.id).catch(() => null);
				// A day planned before the vegetarian-only restriction (ADR-014)
				// existed renders as empty rather than showing a non-veg recipe;
				// the underlying assignment in the store is left untouched.
				const showable = recipe && isVegetarianCategory(recipe.category) ? recipe : null;
				return [
					day,
					showable
						? { id: showable.id, title: showable.title, image: showable.image ?? undefined }
						: null
				] as const;
			})
		);
		if (token !== slotsToken) return;
		resolvedSlots = Object.fromEntries(entries) as Record<Weekday, MealSlotRecipe | null>;
	}

	async function resolvePickerOptions() {
		const token = ++pickerToken;
		const favoriteRecipes = await Promise.all(
			favorites.ids.map(async (ref) => {
				if (ref.source === 'user') return userRecipes.get(ref.id) ?? null;
				return lookupRecipe(ref.id).catch(() => null);
			})
		);
		// Own recipes are already vegetarian-only at creation time and
		// favorites at save time, but this still filters both — defense
		// against any pre-existing data from before ADR-014.
		const combined = [
			...userRecipes.all,
			...favoriteRecipes.filter((r): r is Recipe => r !== null)
		].filter((r) => isVegetarianCategory(r.category));
		if (token !== pickerToken) return;
		const deduped: Recipe[] = [];
		for (const r of combined) {
			if (!deduped.some((x) => x.id === r.id)) deduped.push(r);
		}
		pickerOptions = deduped;
	}

	$effect(() => {
		// mealPlan.slots is read here (as an argument) so this effect re-runs
		// whenever any day's assignment changes.
		resolveSlots(mealPlan.slots);
	});

	function openPicker(day: Weekday) {
		activeDay = day;
		pickerOpen = true;
		resolvePickerOptions();
	}

	function closePicker() {
		pickerOpen = false;
		activeDay = null;
	}

	function handleAssign(ev: CustomEvent<{ day: string }>) {
		openPicker(ev.detail.day as Weekday);
	}

	function handleRemove(ev: CustomEvent<{ day: string }>) {
		mealPlan.unassign(ev.detail.day as Weekday);
	}

	function handlePickerCardClick(ev: CustomEvent<{ recipeId: string }>) {
		if (!activeDay) return;
		const picked = pickerOptions.find((r) => r.id === ev.detail.recipeId);
		if (picked) {
			mealPlan.assign(activeDay, { id: picked.id, source: picked.source });
		}
		closePicker();
	}
</script>

<div class="page-header">
	<span class="eyebrow">Weekly Plan</span>
	<h1>Meal Plan</h1>
	<p>Assign a recipe to each day from your favorites or your own recipes.</p>
</div>

<div class="meal-plan-grid">
	{#each WEEKDAYS as day (day)}
		<recipe-ui-meal-slot
			{day}
			dayLabel={WEEKDAY_LABELS[day]}
			recipe={resolvedSlots[day]}
			onassign={handleAssign}
			onremove={handleRemove}
		></recipe-ui-meal-slot>
	{/each}
</div>

<recipe-ui-modal-dialog
	open={pickerOpen}
	heading={activeDay ? `Pick a recipe for ${WEEKDAY_LABELS[activeDay]}` : ''}
	onclose={closePicker}
>
	{#if pickerOptions.length === 0}
		<div class="empty-state">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
				<path
					d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2.1 0 3.8 1.2 6 3.7C14.2 5.2 15.9 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linejoin="round"
				/>
			</svg>
			<strong>No recipes to pick from yet</strong>
			<p>Favorite a recipe or add your own first.</p>
		</div>
	{:else}
		<div class="recipe-grid">
			{#each pickerOptions as recipe (recipe.id)}
				<recipe-ui-card
					recipeId={recipe.id}
					recipeTitle={recipe.title}
					image={recipe.image ?? undefined}
					category={recipe.category ?? undefined}
					isFavorite={favorites.isFavorite(recipe.id)}
					oncardClick={handlePickerCardClick}
				></recipe-ui-card>
			{/each}
		</div>
	{/if}
</recipe-ui-modal-dialog>
