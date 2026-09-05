import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	server: {
		port: 5174,
		strictPort: true
	},
	preview: {
		port: 5174,
		strictPort: true
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Pinned rather than left on adapter-auto so the build target is
			// explicit and reproducible: adapter-auto only resolves a real adapter
			// on the host, which makes a local `npm run build` prove nothing.
			//
			// adapter-static (not adapter-vercel) because this app has no
			// server-side code whatsoever — no load functions, no +page.server,
			// no hooks — so there is no serverless function to deploy. Static
			// output still deploys to Vercel with zero configuration, and unlike
			// adapter-vercel it builds on Windows (that adapter symlinks inside
			// .vercel/output, which Windows refuses without Developer Mode).
			// `fallback: '200.html'` serves the client-rendered dynamic recipe routes
			// (named 200.html so it does not overwrite the prerendered index.html).
			// See docs/decisions.md ADR-011.
			adapter: adapter({ fallback: '200.html' })
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
