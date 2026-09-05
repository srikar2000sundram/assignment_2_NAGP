import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

/**
 * A recipe summary card — used across the discovery grid, favorites list, and
 * the meal-plan recipe picker. Purely presentational: it never fetches data
 * or reads app state, only emits events for the host app to act on.
 *
 * @slot - Footer actions (e.g. edit/delete buttons shown only for user-created recipes).
 */
@Component({
  tag: 'recipe-ui-card',
  styleUrl: 'recipe-ui-card.css',
  shadow: true,
})
export class RecipeUiCard {
  /** Identifies the recipe in emitted events; not rendered. */
  @Prop() recipeId!: string;
  /** Recipe name. Named `recipeTitle` (not `title`) to avoid colliding with the native HTML `title` tooltip attribute. */
  @Prop() recipeTitle!: string;
  @Prop() image?: string;
  @Prop() category?: string;
  @Prop() isFavorite: boolean = false;

  /** Fired when the card body (not the favorite button) is clicked. */
  @Event() cardClick: EventEmitter<{ recipeId: string }>;
  /** Fired when the favorite button is toggled. */
  @Event() favoriteToggle: EventEmitter<{ recipeId: string }>;

  private handleClick = () => {
    this.cardClick.emit({ recipeId: this.recipeId });
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.handleClick();
    }
  };

  private handleFavoriteClick = (ev: MouseEvent) => {
    ev.stopPropagation();
    this.favoriteToggle.emit({ recipeId: this.recipeId });
  };

  render() {
    return (
      <div class="card" onClick={this.handleClick} onKeyDown={this.handleKeyDown} role="button" tabIndex={0}>
        <div class="card__media">
          {this.image ? (
            <img src={this.image} alt={this.recipeTitle} loading="lazy" />
          ) : (
            <div class="card__media-placeholder" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 15c0-4.4 3.6-8 8-8s8 3.6 8 8"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
                <path d="M3 15h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1Z" stroke="currentColor" stroke-width="1.6" />
                <path d="M10 5.5 12 3l2 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </div>
          )}
          {this.category && <span class="card__category">{this.category}</span>}
          <button
            class={{ card__favorite: true, 'card__favorite--active': this.isFavorite }}
            onClick={this.handleFavoriteClick}
            aria-pressed={this.isFavorite ? 'true' : 'false'}
            aria-label={this.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill={this.isFavorite ? 'currentColor' : 'none'}>
              <path
                d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2.1 0 3.8 1.2 6 3.7C14.2 5.2 15.9 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="card__body">
          <h3 class="card__title">{this.recipeTitle}</h3>
          <div class="card__footer">
            <slot></slot>
          </div>
        </div>
      </div>
    );
  }
}
