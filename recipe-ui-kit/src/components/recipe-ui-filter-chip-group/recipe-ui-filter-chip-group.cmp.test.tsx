import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-filter-chip-group', () => {
  const options = [
    { value: 'chicken', label: 'Chicken' },
    { value: 'seafood', label: 'Seafood' },
  ];

  it('adds a value to selected when an unselected chip is clicked', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group options={options} selected={['chicken']}></recipe-ui-filter-chip-group>,
    );
    const spy = vi.fn();
    root.addEventListener('filterChange', (ev: CustomEvent) => spy(ev.detail));

    root.shadowRoot.querySelectorAll('.chip')[1].dispatchEvent(new Event('click', { bubbles: true }));

    expect(spy).toHaveBeenCalledWith({ selected: ['chicken', 'seafood'] });
  });

  it('removes a value from selected when an active chip is clicked', async () => {
    const { root } = await render(
      <recipe-ui-filter-chip-group options={options} selected={['chicken', 'seafood']}></recipe-ui-filter-chip-group>,
    );
    const spy = vi.fn();
    root.addEventListener('filterChange', (ev: CustomEvent) => spy(ev.detail));

    root.shadowRoot.querySelectorAll('.chip')[0].dispatchEvent(new Event('click', { bubbles: true }));

    expect(spy).toHaveBeenCalledWith({ selected: ['seafood'] });
  });
});
