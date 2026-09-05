<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import { validateRecipeForm, isRecipeFormValid } from '$lib/validation/recipe';
	import { isVegetarianCategory, NON_VEGETARIAN_CATEGORY_MESSAGE } from '$lib/validation/diet';
	import type { RecipeFormValue, RecipeFormErrors } from '@srikar_sundram/recipe-ui-kit';

	let errors = $state<RecipeFormErrors>({});
	/**
	 * Kept separate from `errors` rather than folded into it: RecipeFormErrors
	 * (declared by recipe-ui-kit) only has slots for title/ingredients/
	 * instructions, and this app-wide policy — no non-vegetarian recipes,
	 * anywhere (ADR-014) — isn't a per-field concern the Stencil form itself
	 * knows how to render. So it gets its own banner instead of a fourth
	 * error key the library was never built to display.
	 */
	let dietError = $state<string | null>(null);

	function handleSubmit(ev: CustomEvent<{ recipe: RecipeFormValue }>) {
		const value = ev.detail.recipe;
		const validationErrors = validateRecipeForm(value);
		if (!isRecipeFormValid(validationErrors)) {
			errors = validationErrors;
			dietError = null;
			return;
		}
		if (!isVegetarianCategory(value.category)) {
			errors = {};
			dietError = NON_VEGETARIAN_CATEGORY_MESSAGE;
			return;
		}
		errors = {};
		dietError = null;
		const created = userRecipes.create(value);
		goto(resolve('/recipes/[id]', { id: created.id }));
	}

	function handleCancel() {
		goto(resolve('/'));
	}
</script>

<div class="page-header">
	<span class="eyebrow">Recipe Management</span>
	<h1>Add a Recipe</h1>
	<p>
		Share your own recipe — it'll show up in Discover and can be favorited or planned like any
		other. This app only accepts vegetarian recipes: set Category to "Vegetarian" or "Vegan".
	</p>
</div>

<div class="form-panel">
	{#if dietError}
		<p class="diet-error-banner">{dietError}</p>
	{/if}
	<recipe-ui-form mode="create" {errors} onformSubmit={handleSubmit} oncancel={handleCancel}
	></recipe-ui-form>
</div>
