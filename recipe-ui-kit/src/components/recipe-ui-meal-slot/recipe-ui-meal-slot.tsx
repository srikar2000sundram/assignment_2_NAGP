import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import type { MealSlotRecipe } from '../../types';

/** One day's cell in the weekly meal-plan grid: either an "add recipe" prompt or the assigned recipe with a remove control. */
@Component({
  tag: 'recipe-ui-meal-slot',
  styleUrl: 'recipe-ui-meal-slot.css',
  shadow: true,
})
export class RecipeUiMealSlot {
  /** Weekday key, e.g. "mon" — passed back unchanged in emitted events. */
  @Prop() day: string = '';
  /** Optional display label; falls back to `day` if omitted. */
  @Prop() dayLabel?: string;
  @Prop() recipe: MealSlotRecipe | null = null;

  /**
   * Fired when the host app should open its recipe picker for this day — either
   * because an empty slot was clicked, or because the "change" control on an
   * already-filled slot was clicked. Assigning over a filled slot is how the
   * "modify a planned meal" requirement is satisfied, so both paths emit the
   * same event and the host app treats them identically.
   */
  @Event() assign: EventEmitter<{ day: string }>;
  /** Fired when the remove control on a filled slot is clicked. */
  @Event() remove: EventEmitter<{ day: string }>;

  private handleAssign = () => this.assign.emit({ day: this.day });
  private handleRemove = () => this.remove.emit({ day: this.day });

  render() {
    return (
      <div class={{ slot: true, 'slot--filled': !!this.recipe }}>
        <div class="slot__day">{this.dayLabel ?? this.day}</div>
        {this.recipe ? (
          <div class="slot__filled">
            <button
              type="button"
              class="slot__change"
              onClick={this.handleAssign}
              aria-label={`Change meal for ${this.dayLabel ?? this.day}`}
            >
              {this.recipe.image ? (
                <img src={this.recipe.image} alt="" />
              ) : (
                <div class="slot__filled-placeholder" aria-hidden="true" />
              )}
              <span class="slot__title">{this.recipe.title}</span>
              <span class="slot__change-hint" aria-hidden="true">Change</span>
            </button>
            <button type="button" class="slot__remove" onClick={this.handleRemove} aria-label="Remove meal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" class="slot__empty" onClick={this.handleAssign}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <span>Add recipe</span>
          </button>
        )}
      </div>
    );
  }
}
