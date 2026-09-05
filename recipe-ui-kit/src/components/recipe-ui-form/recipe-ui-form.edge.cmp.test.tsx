import { render, h, describe, it, expect, vi } from '@stencil/vitest';

function fieldInputs(root: HTMLElement) {
  return {
    title: root.shadowRoot.querySelector('.field input') as HTMLInputElement,
    ingredientRows: () => Array.from(root.shadowRoot.querySelectorAll('.ingredients__row')),
    submit: () => root.shadowRoot.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true })),
  };
}

function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event('input'));
}

describe('recipe-ui-form — ingredient rows', () => {
  it('starts with a single blank row in create mode', async () => {
    const { root } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    expect(fieldInputs(root).ingredientRows().length).toBe(1);
  });

  it('adds and removes rows', async () => {
    const { root, waitForChanges } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const f = fieldInputs(root);

    (root.shadowRoot.querySelector('.ingredients__add') as HTMLElement).click();
    await waitForChanges();
    expect(f.ingredientRows().length).toBe(2);

    (f.ingredientRows()[0].querySelector('.ingredients__remove') as HTMLElement).click();
    await waitForChanges();
    expect(f.ingredientRows().length).toBe(1);
  });

  it('allows every row to be removed, then still submits', async () => {
    // Edge case: the component permits an empty ingredient list. The host app's
    // validation is what rejects it — the component must not crash or silently
    // re-add a row.
    const { root, waitForChanges } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const f = fieldInputs(root);

    (f.ingredientRows()[0].querySelector('.ingredients__remove') as HTMLElement).click();
    await waitForChanges();
    expect(f.ingredientRows().length).toBe(0);

    const spy = vi.fn();
    root.addEventListener('formSubmit', (ev: CustomEvent) => spy(ev.detail));
    f.submit();

    expect(spy).toHaveBeenCalledWith({
      recipe: { title: '', image: null, category: null, instructions: '', ingredients: [] },
    });
  });

  it('keeps a measure but drops the row when the ingredient name is blank', async () => {
    const { root, waitForChanges } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const f = fieldInputs(root);

    // Row 0: measure only, no name — must be dropped as unnamed.
    const row0 = f.ingredientRows()[0];
    setValue(row0.querySelectorAll('input')[1] as HTMLInputElement, '2 tbsp');
    (root.shadowRoot.querySelector('.ingredients__add') as HTMLElement).click();
    await waitForChanges();

    // Row 1: name only, no measure — must be kept.
    const row1 = f.ingredientRows()[1];
    setValue(row1.querySelectorAll('input')[0] as HTMLInputElement, 'Salt');

    const spy = vi.fn();
    root.addEventListener('formSubmit', (ev: CustomEvent) => spy(ev.detail));
    f.submit();

    expect(spy.mock.calls[0][0].recipe.ingredients).toEqual([{ name: 'Salt', measure: '' }]);
  });

  it('treats a whitespace-only ingredient name as blank', async () => {
    const { root } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const f = fieldInputs(root);
    setValue(f.ingredientRows()[0].querySelectorAll('input')[0] as HTMLInputElement, '   ');

    const spy = vi.fn();
    root.addEventListener('formSubmit', (ev: CustomEvent) => spy(ev.detail));
    f.submit();

    expect(spy.mock.calls[0][0].recipe.ingredients).toEqual([]);
  });
});

describe('recipe-ui-form — value normalization', () => {
  it('normalizes blank/whitespace image and category to null, and trims them', async () => {
    const { root } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const inputs = root.shadowRoot.querySelectorAll('.field-row input');
    setValue(inputs[0] as HTMLInputElement, '   '); // category
    setValue(inputs[1] as HTMLInputElement, '  https://img/x.png  '); // image

    const spy = vi.fn();
    root.addEventListener('formSubmit', (ev: CustomEvent) => spy(ev.detail));
    fieldInputs(root).submit();

    const recipe = spy.mock.calls[0][0].recipe;
    expect(recipe.category).toBeNull();
    expect(recipe.image).toBe('https://img/x.png');
  });

  it('does not preventDefault away the submit event it is given', async () => {
    // The component calls preventDefault so the native form never navigates.
    const { root } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    const ev = new Event('submit', { cancelable: true });
    root.shadowRoot.querySelector('form').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });
});

describe('recipe-ui-form — edit mode and errors', () => {
  it('re-seeds every field when initialValue changes after mount', async () => {
    const { root, setProps } = await render(<recipe-ui-form mode="edit"></recipe-ui-form>);
    expect(fieldInputs(root).title.value).toBe('');

    await setProps({
      initialValue: {
        title: 'Lamb Rogan Josh',
        image: 'https://img/lamb.png',
        category: 'Lamb',
        instructions: 'Simmer.',
        ingredients: [
          { name: 'Lamb', measure: '500g' },
          { name: 'Yoghurt', measure: '100ml' },
        ],
      },
    });

    expect(fieldInputs(root).title.value).toBe('Lamb Rogan Josh');
    expect(fieldInputs(root).ingredientRows().length).toBe(2);
    expect((root.shadowRoot.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Simmer.');
  });

  it('falls back to one blank row when initialValue has an empty ingredient list', async () => {
    const { root } = await render(
      <recipe-ui-form
        mode="edit"
        initialValue={{ title: 'Sparse', image: null, category: null, instructions: '', ingredients: [] }}
      ></recipe-ui-form>,
    );
    expect(fieldInputs(root).ingredientRows().length).toBe(1);
  });

  it('renders all three field errors at once', async () => {
    const { root } = await render(
      <recipe-ui-form
        mode="create"
        errors={{ title: 'Title is required.', ingredients: 'Add at least one.', instructions: 'Required.' }}
      ></recipe-ui-form>,
    );
    const errors = Array.from(root.shadowRoot.querySelectorAll('.field__error')).map((e) => e.textContent);
    expect(errors).toEqual(['Title is required.', 'Add at least one.', 'Required.']);
  });

  it('clears rendered errors when the host passes an empty errors object', async () => {
    const { root, setProps } = await render(
      <recipe-ui-form mode="create" errors={{ title: 'Title is required.' }}></recipe-ui-form>,
    );
    expect(root.shadowRoot.querySelector('.field__error')).not.toBeNull();

    await setProps({ errors: {} });

    expect(root.shadowRoot.querySelector('.field__error')).toBeNull();
  });

  it('labels the submit button per mode', async () => {
    const { root: create } = await render(<recipe-ui-form mode="create"></recipe-ui-form>);
    expect(create.shadowRoot.querySelector('.actions__submit').textContent).toBe('Add recipe');

    const { root: edit } = await render(<recipe-ui-form mode="edit"></recipe-ui-form>);
    expect(edit.shadowRoot.querySelector('.actions__submit').textContent).toBe('Save changes');
  });
});
