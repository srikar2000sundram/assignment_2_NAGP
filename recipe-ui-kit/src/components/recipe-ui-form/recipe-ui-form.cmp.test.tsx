import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-form', () => {
  it('seeds fields from initialValue in edit mode', async () => {
    const initialValue = {
      title: 'Teriyaki Chicken',
      image: null,
      category: 'Chicken',
      instructions: 'Cook it.',
      ingredients: [{ name: 'Chicken thigh', measure: '2' }],
    };
    const { root } = await render(<recipe-ui-form mode="edit" initialValue={initialValue}></recipe-ui-form>);

    const titleInput = root.shadowRoot.querySelector('.field input') as HTMLInputElement;
    expect(titleInput.value).toBe('Teriyaki Chicken');
    expect(root.shadowRoot.querySelector('.actions__submit').textContent).toBe('Save changes');
  });

  it('emits formSubmit with a normalized recipe, dropping blank ingredient rows', async () => {
    const { root } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const spy = vi.fn();
    root.addEventListener('formSubmit', (ev: CustomEvent) => spy(ev.detail));

    const titleInput = root.shadowRoot.querySelector('.field input') as HTMLInputElement;
    titleInput.value = 'New Recipe';
    titleInput.dispatchEvent(new Event('input'));

    root.shadowRoot.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));

    expect(spy).toHaveBeenCalledWith({
      recipe: {
        title: 'New Recipe',
        image: null,
        category: null,
        instructions: '',
        ingredients: [],
      },
    });
  });

  it('emits cancel when the cancel button is clicked', async () => {
    const { root } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const spy = vi.fn();
    root.addEventListener('cancel', spy);

    (root.shadowRoot.querySelector('.actions__cancel') as HTMLElement).click();

    expect(spy).toHaveBeenCalled();
  });

  it('renders field-level errors passed in via the errors prop', async () => {
    const { root } = await render(<recipe-ui-form mode="create" errors={{ title: 'Title is required' }}></recipe-ui-form>);
    expect(root.shadowRoot.querySelector('.field__error').textContent).toBe('Title is required');
  });
});
