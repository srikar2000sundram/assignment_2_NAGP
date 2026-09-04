import { describe, it, expect, vi, afterEach } from 'vitest';
import { readStorage, writeStorage } from './storage';

/**
 * Runs in the `server` (node) vitest project, where there is no `window` — so
 * the SSR path is exercised for free, and the browser paths are exercised by
 * installing a stub `window`. This matters because SvelteKit renders every one
 * of these stores on the server first, before any browser storage exists.
 */

const KEY = 'recipe-finder:test:v1';

interface StorageStub {
	getItem?: (key: string) => string | null;
	setItem?: (key: string, value: string) => void;
}

/**
 * Install a `window.localStorage` stub. The full `Storage` surface is
 * implemented (not just the two methods under test) so this satisfies the DOM
 * lib types without casts leaking into the assertions.
 */
function installWindow(stub: StorageStub) {
	const backing = new Map<string, string>();
	const localStorage: Storage = {
		getItem: stub.getItem ?? ((key) => backing.get(key) ?? null),
		setItem: stub.setItem ?? ((key, value) => void backing.set(key, value)),
		removeItem: (key) => void backing.delete(key),
		clear: () => backing.clear(),
		key: (index) => [...backing.keys()][index] ?? null,
		get length() {
			return backing.size;
		}
	};

	(globalThis as { window?: unknown }).window = { localStorage };
}

afterEach(() => {
	delete (globalThis as { window?: unknown }).window;
	vi.restoreAllMocks();
});

describe('readStorage — server-side rendering', () => {
	it('returns the fallback when there is no window at all', () => {
		expect(typeof globalThis.window).toBe('undefined');
		expect(readStorage(KEY, { ids: [] })).toEqual({ ids: [] });
	});
});

describe('readStorage — in the browser', () => {
	it('parses stored JSON', () => {
		installWindow({ getItem: () => JSON.stringify({ ids: ['a', 'b'] }) });
		expect(readStorage(KEY, { ids: [] })).toEqual({ ids: ['a', 'b'] });
	});

	it('returns the fallback for a missing key', () => {
		installWindow({ getItem: () => null });
		expect(readStorage(KEY, { ids: ['default'] })).toEqual({ ids: ['default'] });
	});

	it('returns the fallback for an empty string rather than throwing', () => {
		installWindow({ getItem: () => '' });
		expect(readStorage(KEY, { ids: [] })).toEqual({ ids: [] });
	});

	it('returns the fallback for corrupt JSON instead of crashing the UI', () => {
		// Real scenario: a half-written value, or a schema from an older build.
		installWindow({ getItem: () => '{not valid json' });
		expect(readStorage(KEY, { ids: [] })).toEqual({ ids: [] });
	});

	it('returns the fallback when localStorage access itself throws', () => {
		// Browsers configured to block site data throw on property access.
		installWindow({
			getItem: () => {
				throw new DOMException('SecurityError');
			}
		});
		expect(readStorage(KEY, { ids: [] })).toEqual({ ids: [] });
	});

	it('round-trips a value written by writeStorage', () => {
		let stored: string | null = null;
		installWindow({
			getItem: () => stored,
			setItem: (_k, v) => {
				stored = v;
			}
		});

		writeStorage(KEY, { slots: { mon: { id: '1', source: 'api' } } });

		expect(readStorage(KEY, null)).toEqual({ slots: { mon: { id: '1', source: 'api' } } });
	});
});

describe('writeStorage', () => {
	it('is a no-op on the server rather than throwing', () => {
		expect(() => writeStorage(KEY, { ids: [] })).not.toThrow();
	});

	it('serializes the value to the given key', () => {
		const setItem = vi.fn();
		installWindow({ setItem });

		writeStorage(KEY, { ids: [{ id: '52772', source: 'api' }] });

		expect(setItem).toHaveBeenCalledWith(KEY, '{"ids":[{"id":"52772","source":"api"}]}');
	});

	it('swallows a quota-exceeded failure — persistence is best-effort here', () => {
		installWindow({
			setItem: () => {
				throw new DOMException('QuotaExceededError');
			}
		});

		// A failed save must never take the UI down with it.
		expect(() => writeStorage(KEY, { ids: [] })).not.toThrow();
	});

	it('swallows a serialization failure (circular structure)', () => {
		installWindow({});
		const circular: Record<string, unknown> = {};
		circular.self = circular;

		expect(() => writeStorage(KEY, circular)).not.toThrow();
	});
});
