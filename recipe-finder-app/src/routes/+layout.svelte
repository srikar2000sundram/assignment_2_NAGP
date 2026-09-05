<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	// Registers every recipe-ui-kit custom element once, globally, so any
	// route can use the tags directly. Loaded from the *published* package's
	// dist-custom-elements build (one self-registering module per component),
	// NOT the lazy loader — see docs/decisions.md ADR-013 for why: the loader
	// fetches a shared component bundle via a runtime-computed path that
	// Vite's production bundler cannot statically analyze, so that file never
	// gets copied into the build output and every custom element silently
	// fails to render. Each import below is a literal string, which Vite can
	// bundle correctly, and importing it is enough — Stencil's
	// `auto-define-custom-elements` behavior calls `customElements.define()`
	// as a side effect.
	onMount(async () => {
		await Promise.all([
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-card'),
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-search-bar'),
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-filter-chip-group'),
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-rating-badge'),
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-form'),
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-meal-slot'),
			import('@srikar_sundram/recipe-ui-kit/recipe-ui-modal-dialog')
		]);
	});

	const navLinks = [
		{ href: '/', label: 'Discover' },
		{ href: '/favorites', label: 'Favorites' },
		{ href: '/meal-plan', label: 'Meal Plan' },
		{ href: '/recipes/new', label: 'Add Recipe' }
	] as const;
</script>

<svelte:head>
	<title>Recipe Finder & Meal Planner</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="app-nav">
	<a class="app-nav__brand" href={resolve('/')}>
		<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
			<circle cx="16" cy="16" r="16" fill="var(--ruik-color-primary)" />
			<path
				d="M9 9v6a3 3 0 0 0 2 2.83V24a1 1 0 0 0 2 0v-6.17A3 3 0 0 0 15 15V9a1 1 0 0 0-2 0v5h-1V9a1 1 0 0 0-2 0v5H9V9a1 1 0 0 0-2 0v6a1 1 0 0 0 0 0"
				fill="var(--ruik-color-on-primary)"
			/>
			<path
				d="M22 9c-1.66 0-3 2.24-3 5s1.34 5 3 5v5a1 1 0 0 0 2 0V9a1 1 0 0 0-2 0z"
				fill="var(--ruik-color-on-primary)"
			/>
		</svg>
		Recipe Finder
	</a>
	<div class="app-nav__links">
		{#each navLinks as link (link.href)}
			<a href={resolve(link.href)} class:active={page.url.pathname === link.href}>{link.label}</a>
		{/each}
	</div>
</nav>

<div class="app-shell">
	{@render children()}
</div>
