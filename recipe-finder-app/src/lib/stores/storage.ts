/**
 * Thin, SSR-safe localStorage wrapper shared by every store in this folder.
 * SvelteKit renders on the server first (no `window`), so every read/write
 * must tolerate that — see docs/decisions.md ADR-005.
 */

export function readStorage<T>(key: string, fallback: T): T {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function writeStorage<T>(key: string, value: T): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Quota exceeded or serialization failure — non-critical for this app, so
		// fail silently rather than crashing the UI over a persistence miss.
	}
}
