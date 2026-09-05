import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import type { FilterOption } from '../../types';

/**
 * A row of toggleable filter chips (e.g. recipe categories or cuisines).
 * Multi-select: clicking a chip emits the full next `selected` array and
 * waits for the host app to feed it back via the `selected` prop — the
 * component does not keep its own copy of selection state.
 */
@Component({
  tag: 'recipe-ui-filter-chip-group',
  styleUrl: 'recipe-ui-filter-chip-group.css',
  shadow: true,
})
export class RecipeUiFilterChipGroup {
  @Prop() options: FilterOption[] = [];
  @Prop() selected: string[] = [];

  /** Named `filterChange`, not `selectionChange`, to avoid colliding with the native `selectionchange` DOM event. */
  @Event() filterChange: EventEmitter<{ selected: string[] }>;

  private toggle(value: string) {
    const isSelected = this.selected.includes(value);
    const next = isSelected ? this.selected.filter((v) => v !== value) : [...this.selected, value];
    this.filterChange.emit({ selected: next });
  }

  render() {
    return (
      <div class="chip-group" role="group">
        {this.options.map((option) => {
          const active = this.selected.includes(option.value);
          return (
            <button
              type="button"
              class={{ chip: true, 'chip--active': active }}
              aria-pressed={active ? 'true' : 'false'}
              onClick={() => this.toggle(option.value)}
            >
              {active && (
                <svg class="chip__check" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    stroke-width="2.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
}
