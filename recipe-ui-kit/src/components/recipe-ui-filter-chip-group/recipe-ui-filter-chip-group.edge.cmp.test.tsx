import { render, h, describe, it, expect, vi } from '@stencil/vitest';

const OPTIONS = [
  { value: 'Chicken', label: 'Chicken' },
  { value: 'Dessert', label: 'Dessert' },
  { value: 'Vegetarian', label: 'Vegetarian' },
];

/**
 * This component is deliberately *controlled*: it emits the full next selection
 * and waits for the host to feed it back via the `selected` prop. These tests
 * pin that down, because an accidental switch to internal selection state would
 * silently desynchronise it from the app's URL/query state.
 */
describe('recipe-ui-filter-chip-group — controlled selection', () => {
  it('emits the additive next selection when an unselected chip is clicked', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group options={OPTIONS} selected={['Chicken']}></recipe-ui-filter-chip-group>,
    );
    const spy = vi.fn();
    root.addEventListener('filterChange', (ev: CustomEvent) => spy(ev.detail));

    const chips = root.shadowRoot.querySelectorAll('.chip');
    (chips[1] as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith({ selected: ['Chicken', 'Dessert'] });
  });

  it('emits the subtractive next selection when a selected chip is clicked', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group
        options={OPTIONS}
        selected={['Chicken', 'Dessert']}
      ></recipe-ui-filter-chip-group>,
    );
    const spy = vi.fn();
    root.addEventListener('filterChange', (ev: CustomEvent) => spy(ev.detail));

    (root.shadowRoot.querySelectorAll('.chip')[0] as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith({ selected: ['Dessert'] });
  });

  it('does not mutate its own selected prop — the host owns that state', async () => {
    const selected = ['Chicken'];
    const { root, waitForChanges } = await render(
      <recipe-ui-filter-chip-group options={OPTIONS} selected={selected}></recipe-ui-filter-chip-group>,
    );

    (root.shadowRoot.querySelectorAll('.chip')[1] as HTMLElement).click();
    await waitForChanges();

    // Still exactly one active chip: the component emitted, it did not self-update.
    expect(selected).toEqual(['Chicken']);
    expect(root.shadowRoot.querySelectorAll('.chip--active').length).toBe(1);
  });

  it('reflects a selection pushed in from the host', async () => {
    const { root, setProps } = await render(
      <recipe-ui-filter-chip-group options={OPTIONS} selected={[]}></recipe-ui-filter-chip-group>,
    );
    expect(root.shadowRoot.querySelectorAll('.chip--active').length).toBe(0);

    await setProps({ selected: ['Chicken', 'Vegetarian'] });

    const active = Array.from(root.shadowRoot.querySelectorAll('.chip--active')).map((c) => c.textContent.trim());
    expect(active).toEqual(['Chicken', 'Vegetarian']);
  });
});

describe('recipe-ui-filter-chip-group — rendering edge cases', () => {
  it('renders an empty group when given no options', async () => {
    const { root } = await render(<recipe-ui-filter-chip-group options={[]}></recipe-ui-filter-chip-group>);
    expect(root.shadowRoot.querySelectorAll('.chip').length).toBe(0);
    expect(root.shadowRoot.querySelector('.chip-group').getAttribute('role')).toBe('group');
  });

  it('shows a check icon only on active chips and sets aria-pressed on every chip', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group options={OPTIONS} selected={['Dessert']}></recipe-ui-filter-chip-group>,
    );

    const chips = Array.from(root.shadowRoot.querySelectorAll('.chip'));
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    expect(root.shadowRoot.querySelectorAll('.chip__check').length).toBe(1);
  });

  it('ignores a selected value that is not among the options', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group options={OPTIONS} selected={['Nonexistent']}></recipe-ui-filter-chip-group>,
    );
    expect(root.shadowRoot.querySelectorAll('.chip--active').length).toBe(0);
  });

  it('renders a label that differs from the underlying value', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group
        options={[{ value: 'chicken_breast', label: 'Chicken Breast' }]}
      ></recipe-ui-filter-chip-group>,
    );
    const spy = vi.fn();
    root.addEventListener('filterChange', (ev: CustomEvent) => spy(ev.detail));

    const chip = root.shadowRoot.querySelector('.chip') as HTMLElement;
    expect(chip.textContent.trim()).toBe('Chicken Breast');
    chip.click();

    // Emits the value, never the display label.
    expect(spy).toHaveBeenCalledWith({ selected: ['chicken_breast'] });
  });
});
