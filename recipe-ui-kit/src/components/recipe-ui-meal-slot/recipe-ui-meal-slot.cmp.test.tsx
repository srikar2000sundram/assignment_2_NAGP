import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-meal-slot', () => {
  it('emits assign when an empty slot is clicked', async () => {
    const { root } = await render(<recipe-ui-meal-slot day="mon"></recipe-ui-meal-slot>);
    const spy = vi.fn();
    root.addEventListener('assign', (ev: CustomEvent) => spy(ev.detail));

    (root.shadowRoot.querySelector('.slot__empty') as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith({ day: 'mon' });
  });

  it('renders the assigned recipe and emits remove', async () => {
    const recipe = { id: '52772', title: 'Teriyaki Chicken' };
    const { root } = await render(<recipe-ui-meal-slot day="tue" recipe={recipe}></recipe-ui-meal-slot>);
    const spy = vi.fn();
    root.addEventListener('remove', (ev: CustomEvent) => spy(ev.detail));

    expect(root.shadowRoot.querySelector('.slot__title').textContent).toBe('Teriyaki Chicken');
    (root.shadowRoot.querySelector('.slot__remove') as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith({ day: 'tue' });
  });

  // The "modify a planned meal" requirement: a filled slot must offer a way to
  // swap its recipe, not just clear it. Both paths deliberately emit `assign`.
  it('emits assign from the change control on a filled slot', async () => {
    const recipe = { id: '52772', title: 'Teriyaki Chicken' };
    const { root } = await render(<recipe-ui-meal-slot day="wed" recipe={recipe}></recipe-ui-meal-slot>);
    const spy = vi.fn();
    root.addEventListener('assign', (ev: CustomEvent) => spy(ev.detail));

    (root.shadowRoot.querySelector('.slot__change') as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith({ day: 'wed' });
  });

  it('offers no change control while the slot is empty', async () => {
    const { root } = await render(<recipe-ui-meal-slot day="thu"></recipe-ui-meal-slot>);
    expect(root.shadowRoot.querySelector('.slot__change')).toBeNull();
    expect(root.shadowRoot.querySelector('.slot__remove')).toBeNull();
  });

  it('falls back to the day key when no dayLabel is given', async () => {
    const { root } = await render(<recipe-ui-meal-slot day="fri"></recipe-ui-meal-slot>);
    expect(root.shadowRoot.querySelector('.slot__day').textContent).toBe('fri');

    const { root: labelled } = await render(
      <recipe-ui-meal-slot day="fri" dayLabel="Friday"></recipe-ui-meal-slot>,
    );
    expect(labelled.shadowRoot.querySelector('.slot__day').textContent).toBe('Friday');
  });

  it('renders a placeholder instead of an image when the recipe has none', async () => {
    const { root } = await render(
      <recipe-ui-meal-slot day="sat" recipe={{ id: 'u1', title: 'My Recipe' }}></recipe-ui-meal-slot>,
    );
    expect(root.shadowRoot.querySelector('.slot__filled-placeholder')).not.toBeNull();
    expect(root.shadowRoot.querySelector('.slot__change img')).toBeNull();
  });
});
