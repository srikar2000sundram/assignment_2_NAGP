import { render, h, describe, it, expect, vi } from '@stencil/vitest';

/**
 * Debounce behaviour is timing-sensitive, so these tests drive a short real
 * `debounceMs` and wait, rather than installing fake timers inside the browser
 * runner (fake timers and the custom-element lifecycle interact badly here).
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function type(root: HTMLElement, value: string) {
  const input = root.shadowRoot.querySelector('input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('recipe-ui-search-bar — debounce', () => {
  it('emits once with the final value when typing quickly', async () => {
    const { root } = await render(<recipe-ui-search-bar debounceMs={30}></recipe-ui-search-bar>);
    const spy = vi.fn();
    root.addEventListener('searchChange', (ev: CustomEvent) => spy(ev.detail));

    type(root, 'chi');
    type(root, 'chic');
    type(root, 'chicken');

    // Nothing yet — the window has not elapsed.
    expect(spy).not.toHaveBeenCalled();

    await wait(80);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ value: 'chicken' });
  });

  it('emits per pause when typing is spaced out', async () => {
    const { root } = await render(<recipe-ui-search-bar debounceMs={20}></recipe-ui-search-bar>);
    const spy = vi.fn();
    root.addEventListener('searchChange', (ev: CustomEvent) => spy(ev.detail));

    type(root, 'soup');
    await wait(60);
    type(root, 'stew');
    await wait(60);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, { value: 'soup' });
    expect(spy).toHaveBeenNthCalledWith(2, { value: 'stew' });
  });
});

describe('recipe-ui-search-bar — clear button', () => {
  it('is hidden while the field is empty and appears once there is text', async () => {
    const { root, waitForChanges } = await render(<recipe-ui-search-bar debounceMs={10}></recipe-ui-search-bar>);
    expect(root.shadowRoot.querySelector('.search-bar__clear')).toBeNull();

    type(root, 'rice');
    await waitForChanges();

    expect(root.shadowRoot.querySelector('.search-bar__clear')).not.toBeNull();
  });

  it('emits an empty value immediately, without waiting for the debounce', async () => {
    const { root, waitForChanges } = await render(<recipe-ui-search-bar debounceMs={500}></recipe-ui-search-bar>);
    type(root, 'rice');
    await waitForChanges();

    const spy = vi.fn();
    root.addEventListener('searchChange', (ev: CustomEvent) => spy(ev.detail));
    (root.shadowRoot.querySelector('.search-bar__clear') as HTMLElement).click();

    // Synchronous: clearing is an explicit action, so it must not sit behind a
    // 500ms debounce, and it must cancel the pending keystroke emit.
    expect(spy).toHaveBeenCalledWith({ value: '' });

    await wait(60);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('recipe-ui-search-bar — props', () => {
  it('seeds the input from the value prop and follows later changes', async () => {
    const { root, setProps } = await render(<recipe-ui-search-bar value="pasta"></recipe-ui-search-bar>);
    const input = root.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('pasta');

    // @Watch('value') must push a later prop change into the internal state.
    await setProps({ value: 'noodles' });

    expect((root.shadowRoot.querySelector('input') as HTMLInputElement).value).toBe('noodles');
  });

  it('applies a custom placeholder', async () => {
    const { root } = await render(<recipe-ui-search-bar placeholder="Find dinner…"></recipe-ui-search-bar>);
    expect((root.shadowRoot.querySelector('input') as HTMLInputElement).placeholder).toBe('Find dinner…');
  });

  it('does not emit after the element is removed mid-debounce', async () => {
    const { root } = await render(<recipe-ui-search-bar debounceMs={30}></recipe-ui-search-bar>);
    const spy = vi.fn();
    root.addEventListener('searchChange', spy);

    type(root, 'lamb');
    root.remove();
    await wait(80);

    // disconnectedCallback clears the pending timer, so no stray emit lands
    // after teardown.
    expect(spy).not.toHaveBeenCalled();
  });
});
