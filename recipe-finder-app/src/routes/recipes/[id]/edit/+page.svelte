<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import { validateRecipeForm, isRecipeFormValid } from '$lib/validation/recipe';
	import type { RecipeFormValue, RecipeFormErrors } from '@srikar_sundram/recipe-ui-kit';

	let errors = $state<RecipeFormErrors>({});
	let recipe = $derived(page.params.id ? userRecipes.get(page.params.id) : undefined);

	function handleSubmit(ev: CustomEvent<{ recipe: RecipeFormValue }>) {
		if (!recipe) return;
		const value = ev.detail.recipe;
		const validationErrors = validateRecipeForm(value);
		if (!isRecipeFormValid(validationErrors)) {
			errors = validationErrors;
			return;
		}
		errors = {};
		userRecipes.update(recipe.id, value);
		goto(resolve('/recipes/[id]', { id: recipe.id }));
	}

	function handleCancel() {
		goto(recipe ? resolve('/recipes/[id]', { id: recipe.id }) : resolve('/'));
	}
</script>

<div class="page-header">
	<span class="eyebrow">Recipe Management</span>
	<h1>Edit Recipe</h1>
</div>

{#if !recipe}
	<div class="empty-state">
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
			<path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
		</svg>
		<strong>Can't edit this recipe</strong>
		<p>It's either not a recipe you created, or it no longer exists.</p>
		<a class="btn btn--primary" href={resolve('/')}>Back to discovery</a>
	</div>
{:else}
	<div class="form-panel">
		<recipe-ui-form
			mode="edit"
			initialValue={{
				title: recipe.title,
				image: recipe.image,
				category: recipe.category,
				instructions: recipe.instructions,
				ingredients: recipe.ingredients
			}}
			{errors}
			onformSubmit={handleSubmit}
			oncancel={handleCancel}
		></recipe-ui-form>
	</div>
{/if}
