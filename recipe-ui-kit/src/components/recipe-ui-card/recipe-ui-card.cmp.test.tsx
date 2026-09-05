import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-card', () => {
  it('renders title and category', async () => {
    const { root } = await render(
      <recipe-ui-card recipeId="52772" recipeTitle="Teriyaki Chicken" category="Chicken"></recipe-ui-card>,
    );
    expect(root.shadowRoot.querySelector('.card__title').textContent).toBe('Teriyaki Chicken');
    expect(root.shadowRoot.querySelector('.card__category').textContent).toBe('Chicken');
  });

  it('emits cardClick with the recipeId when the body is clicked', async () => {
    const { root } = await render(<recipe-ui-card recipeId="52772" recipeTitle="Teriyaki Chicken"></recipe-ui-card>);
    const spy = vi.fn();
    root.addEventListener('cardClick', (ev: CustomEvent) => spy(ev.detail));

    (root.shadowRoot.querySelector('.card') as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith({ recipeId: '52772' });
  });

  it('emits favoriteToggle without also emitting cardClick', async () => {
    const { root } = await render(<recipe-ui-card recipeId="52772" recipeTitle="Teriyaki Chicken"></recipe-ui-card>);
    const clickSpy = vi.fn();
    const favoriteSpy = vi.fn();
    root.addEventListener('cardClick', clickSpy);
    root.addEventListener('favoriteToggle', (ev: CustomEvent) => favoriteSpy(ev.detail));

    (root.shadowRoot.querySelector('.card__favorite') as HTMLElement).click();

    expect(favoriteSpy).toHaveBeenCalledWith({ recipeId: '52772' });
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
