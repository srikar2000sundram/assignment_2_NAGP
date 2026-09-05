import { render, h, describe, it, expect } from '@stencil/vitest';

/**
 * Runs in the `unit` vitest project (`environment: 'stencil'`) rather than the
 * browser project — this component is pure markup with no events, timers or
 * layout dependency, so it needs no real browser and runs an order of magnitude
 * faster here. See ../../../vitest.config.ts for the project split.
 */
describe('recipe-ui-rating-badge', () => {
  it('renders the label', async () => {
    const { root } = await render(<recipe-ui-rating-badge label="Chicken"></recipe-ui-rating-badge>);
    expect(root.shadowRoot.querySelector('.badge').textContent).toBe('Chicken');
  });

  it('defaults to the neutral variant', async () => {
    const { root } = await render(<recipe-ui-rating-badge label="Plain"></recipe-ui-rating-badge>);
    expect(root.shadowRoot.querySelector('.badge').classList.contains('badge--neutral')).toBe(true);
  });

  it.each(['neutral', 'success', 'warning', 'info'] as const)('applies the %s variant class', async (variant) => {
    const { root } = await render(<recipe-ui-rating-badge label="X" variant={variant}></recipe-ui-rating-badge>);
    expect(root.shadowRoot.querySelector('.badge').classList.contains(`badge--${variant}`)).toBe(true);
  });

  it('renders an empty badge rather than failing when no label is given', async () => {
    const { root } = await render(<recipe-ui-rating-badge></recipe-ui-rating-badge>);
    expect(root.shadowRoot.querySelector('.badge').textContent).toBe('');
  });
});
