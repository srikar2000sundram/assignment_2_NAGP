<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { userRecipes } from '$lib/stores/userRecipes.svelte';
	import { validateRecipeForm, isRecipeFormValid } from '$lib/validation/recipe';
	import type { RecipeFormValue, RecipeFormErrors } from 'recipe-ui-kit';

	let errors = $state<RecipeFormErrors>({});

	function handleSubmit(ev: CustomEvent<{ recipe: RecipeFormValue }>) {
		const value = ev.detail.recipe;
		const validationErrors = validateRecipeForm(value);
		if (!isRecipeFormValid(validationErrors)) {
			errors = validationErrors;
			return;
		}
		errors = {};
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
		other.
	</p>
</div>

<div class="form-panel">
	<recipe-ui-form mode="create" {errors} onformSubmit={handleSubmit} oncancel={handleCancel}
	></recipe-ui-form>
</div>
