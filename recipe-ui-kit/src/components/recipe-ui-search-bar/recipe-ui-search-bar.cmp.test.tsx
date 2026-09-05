import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-search-bar', () => {
  it('debounces input before emitting searchChange', async () => {
    // Real timers, not vi.useFakeTimers(): this test runs the component in an
    // actual browser (Playwright) context, and fake timers in the Node test
    // runner don't reach into that realm's setTimeout.
    const { root } = await render(<recipe-ui-search-bar debounceMs={20}></recipe-ui-search-bar>);
    const spy = vi.fn();
    root.addEventListener('searchChange', (ev: CustomEvent) => spy(ev.detail));

    const input = root.shadowRoot.querySelector('input') as HTMLInputElement;
    input.value = 'pasta';
    input.dispatchEvent(new Event('input'));

    expect(spy).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith({ value: 'pasta' }));
  });
});
