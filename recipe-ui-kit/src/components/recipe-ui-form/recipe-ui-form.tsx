import { Component, Prop, State, Watch, Event, EventEmitter, h } from '@stencil/core';
import type { RecipeFormValue, RecipeFormErrors, RecipeIngredient } from '../../types';

/**
 * Collects a recipe (title, image, category, ingredients, instructions) and
 * emits it on submit. Deliberately has no built-in business validation
 * beyond marking fields as `required` for baseline UX — the host app
 * validates and feeds errors back in via the `errors` prop, per the
 * Recipe Management requirement ("validate recipe input before saving").
 */
@Component({
  tag: 'recipe-ui-form',
  styleUrl: 'recipe-ui-form.css',
  shadow: true,
})
export class RecipeUiForm {
  @Prop() initialValue?: RecipeFormValue;
  @Prop() mode: 'create' | 'edit' = 'create';
  /** Field-level errors from the host app's validation, keyed by field name. */
  @Prop() errors?: RecipeFormErrors;

  /** Named `formSubmit`, not `submit`, so it can't be confused with the native <form> submit event that bubbles inside this shadow root. */
  @Event() formSubmit: EventEmitter<{ recipe: RecipeFormValue }>;
  @Event() cancel: EventEmitter<void>;

  @State() private formTitle = '';
  @State() private image = '';
  @State() private category = '';
  @State() private instructions = '';
  @State() private ingredients: RecipeIngredient[] = [{ name: '', measure: '' }];

  componentWillLoad() {
    this.resetFromInitialValue();
  }

  @Watch('initialValue')
  onInitialValueChange() {
    this.resetFromInitialValue();
  }

  private resetFromInitialValue() {
    const v = this.initialValue;
    this.formTitle = v?.title ?? '';
    this.image = v?.image ?? '';
    this.category = v?.category ?? '';
    this.instructions = v?.instructions ?? '';
    this.ingredients = v?.ingredients?.length ? [...v.ingredients] : [{ name: '', measure: '' }];
  }

  private updateIngredient(index: number, field: keyof RecipeIngredient, value: string) {
    this.ingredients = this.ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing));
  }

  private addIngredientRow = () => {
    this.ingredients = [...this.ingredients, { name: '', measure: '' }];
  };

  private removeIngredientRow = (index: number) => {
    this.ingredients = this.ingredients.filter((_, i) => i !== index);
  };

  private handleSubmit = (ev: globalThis.Event) => {
    ev.preventDefault();
    this.formSubmit.emit({
      recipe: {
        title: this.formTitle,
        image: this.image.trim() ? this.image.trim() : null,
        category: this.category.trim() ? this.category.trim() : null,
        instructions: this.instructions,
        ingredients: this.ingredients.filter((i) => i.name.trim().length > 0),
      },
    });
  };

  private handleCancel = () => this.cancel.emit();

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label class="field">
          <span>Title</span>
          <input
            type="text"
            required
            placeholder="e.g. Weeknight Chicken Teriyaki"
            value={this.formTitle}
            onInput={(e) => (this.formTitle = (e.target as HTMLInputElement).value)}
          />
          {this.errors?.title && <small class="field__error">{this.errors.title}</small>}
        </label>

        <div class="field-row">
          <label class="field">
            <span>Category</span>
            <input
              type="text"
              placeholder="e.g. Dinner"
              value={this.category}
              onInput={(e) => (this.category = (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="field">
            <span>Image URL</span>
            <div class="image-input">
              {this.image ? (
                <img class="image-input__preview" src={this.image} alt="" />
              ) : (
                <span class="image-input__preview image-input__preview--empty" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 15c0-4.4 3.6-8 8-8s8 3.6 8 8"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                    <path d="M3 15h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1Z" stroke="currentColor" stroke-width="1.6" />
                  </svg>
                </span>
              )}
              <input
                type="text"
                placeholder="https://…"
                value={this.image}
                onInput={(e) => (this.image = (e.target as HTMLInputElement).value)}
              />
            </div>
          </label>
        </div>

        <fieldset class="ingredients">
          <legend>Ingredients</legend>
          {this.ingredients.map((ingredient, index) => (
            <div class="ingredients__row" key={index}>
              <input
                type="text"
                placeholder="Ingredient"
                value={ingredient.name}
                onInput={(e) => this.updateIngredient(index, 'name', (e.target as HTMLInputElement).value)}
              />
              <input
                type="text"
                placeholder="Amount"
                value={ingredient.measure}
                onInput={(e) => this.updateIngredient(index, 'measure', (e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="ingredients__remove"
                onClick={() => this.removeIngredientRow(index)}
                aria-label="Remove ingredient"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          ))}
          {this.errors?.ingredients && <small class="field__error">{this.errors.ingredients}</small>}
          <button type="button" class="ingredients__add" onClick={this.addIngredientRow}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Add ingredient
          </button>
        </fieldset>

        <label class="field">
          <span>Instructions</span>
          <textarea
            required
            rows={6}
            placeholder="Step by step…"
            value={this.instructions}
            onInput={(e) => (this.instructions = (e.target as HTMLTextAreaElement).value)}
          ></textarea>
          {this.errors?.instructions && <small class="field__error">{this.errors.instructions}</small>}
        </label>

        <div class="actions">
          <button type="button" class="actions__cancel" onClick={this.handleCancel}>
            Cancel
          </button>
          <button type="submit" class="actions__submit">
            {this.mode === 'edit' ? 'Save changes' : 'Add recipe'}
          </button>
        </div>
      </form>
    );
  }
}
