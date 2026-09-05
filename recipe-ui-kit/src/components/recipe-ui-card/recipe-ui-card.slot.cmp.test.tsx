import { render, h, describe, it, expect, vi } from '@stencil/vitest';

/**
 * The card's default slot is where a host app puts per-card actions (the
 * SvelteKit app projects Edit/Delete there for user-created recipes).
 *
 * The subtlety worth testing: slotted content lives in the *host's* light DOM,
 * but it renders inside the shadow `.card` element that carries the `cardClick`
 * handler. So a click on a slotted button bubbles into the card and would
 * navigate unless the host stops propagation. These tests pin down both halves
 * of that contract so a regression shows up here rather than as a mystery
 * navigation in the app.
 */
describe('recipe-ui-card — footer slot', () => {
  it('projects slotted content into the card footer', async () => {
    const { root } = await render(
      <recipe-ui-card recipeId="u1" recipeTitle="My Recipe">
        <button class="probe-edit">Edit</button>
      </recipe-ui-card>,
    );

    const slot = root.shadowRoot.querySelector('.card__footer slot') as HTMLSlotElement;
    expect(slot).not.toBeNull();
    expect(slot.assignedElements().map((el) => el.className)).toEqual(['probe-edit']);
  });

  it('lets a slotted click bubble to cardClick when the host does not stop it', async () => {
    const { root } = await render(
      <recipe-ui-card recipeId="u1" recipeTitle="My Recipe">
        <button class="probe-edit">Edit</button>
      </recipe-ui-card>,
    );
    const spy = vi.fn();
    root.addEventListener('cardClick', (ev: CustomEvent) => spy(ev.detail));

    (root.querySelector('.probe-edit') as HTMLElement).click();

    // Documents the default: propagation reaches the card. This is *why* the
    // app's slotted handlers must call stopPropagation().
    expect(spy).toHaveBeenCalledWith({ recipeId: 'u1' });
  });

  it('suppresses cardClick when the slotted handler stops propagation', async () => {
    const { root } = await render(
      <recipe-ui-card recipeId="u1" recipeTitle="My Recipe">
        <button class="probe-edit">Edit</button>
      </recipe-ui-card>,
    );
    const cardSpy = vi.fn();
    const editSpy = vi.fn();
    root.addEventListener('cardClick', cardSpy);

    const editButton = root.querySelector('.probe-edit') as HTMLElement;
    editButton.addEventListener('click', (ev) => {
      ev.stopPropagation();
      editSpy();
    });
    editButton.click();

    expect(editSpy).toHaveBeenCalled();
    expect(cardSpy).not.toHaveBeenCalled();
  });

  it('renders an empty footer slot when nothing is projected', async () => {
    const { root } = await render(<recipe-ui-card recipeId="52772" recipeTitle="Teriyaki"></recipe-ui-card>);
    const slot = root.shadowRoot.querySelector('.card__footer slot') as HTMLSlotElement;
    expect(slot.assignedElements()).toEqual([]);
  });
});

describe('recipe-ui-card — presentation edge cases', () => {
  it('renders a placeholder instead of an <img> when no image is given', async () => {
    const { root } = await render(<recipe-ui-card recipeId="u1" recipeTitle="No Image"></recipe-ui-card>);
    expect(root.shadowRoot.querySelector('.card__media-placeholder')).not.toBeNull();
    expect(root.shadowRoot.querySelector('.card__media img')).toBeNull();
  });

  it('omits the category pill when no category is given', async () => {
    const { root } = await render(<recipe-ui-card recipeId="u1" recipeTitle="Uncategorised"></recipe-ui-card>);
    expect(root.shadowRoot.querySelector('.card__category')).toBeNull();
  });

  it('reflects favorite state into the button aria-pressed and label', async () => {
    const { root } = await render(
      <recipe-ui-card recipeId="u1" recipeTitle="Saved" isFavorite={true}></recipe-ui-card>,
    );
    const button = root.shadowRoot.querySelector('.card__favorite');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Remove from favorites');
    expect(button.classList.contains('card__favorite--active')).toBe(true);
  });

  it('activates via keyboard (Enter and Space) for non-mouse users', async () => {
    const { root } = await render(<recipe-ui-card recipeId="52772" recipeTitle="Teriyaki"></recipe-ui-card>);
    const spy = vi.fn();
    root.addEventListener('cardClick', (ev: CustomEvent) => spy(ev.detail));

    const card = root.shadowRoot.querySelector('.card') as HTMLElement;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ignores unrelated keys', async () => {
    const { root } = await render(<recipe-ui-card recipeId="52772" recipeTitle="Teriyaki"></recipe-ui-card>);
    const spy = vi.fn();
    root.addEventListener('cardClick', spy);

    (root.shadowRoot.querySelector('.card') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );

    expect(spy).not.toHaveBeenCalled();
  });
});
