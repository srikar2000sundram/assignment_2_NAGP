<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	// Registers every recipe-ui-kit custom element once, globally, so any
	// route can use the tags directly. Loaded from the *published* package's
	// lazy-loader entry point, not from source — see docs/decisions.md ADR-004.
	onMount(async () => {
		const { defineCustomElements } = await import('@srikar_sundram/recipe-ui-kit/loader');
		defineCustomElements();
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
