import { Component, Prop, h } from '@stencil/core';
import type { RatingBadgeVariant } from '../../types';

/** A small colored label — e.g. a difficulty/cuisine/dietary tag on a recipe details page. */
@Component({
  tag: 'recipe-ui-rating-badge',
  styleUrl: 'recipe-ui-rating-badge.css',
  shadow: true,
})
export class RecipeUiRatingBadge {
  @Prop() label: string = '';
  @Prop() variant: RatingBadgeVariant = 'neutral';

  render() {
    return <span class={{ badge: true, [`badge--${this.variant}`]: true }}>{this.label}</span>;
  }
}
