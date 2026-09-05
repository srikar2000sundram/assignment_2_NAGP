import { render, h, describe, it, expect } from '@stencil/vitest';

describe('recipe-ui-rating-badge', () => {
  it('renders the label and applies the variant class', async () => {
    const { root } = await render(<recipe-ui-rating-badge label="Easy" variant="success"></recipe-ui-rating-badge>);
    const badge = root.shadowRoot.querySelector('.badge');
    expect(badge.textContent).toBe('Easy');
    expect(badge.classList.contains('badge--success')).toBe(true);
  });
});
