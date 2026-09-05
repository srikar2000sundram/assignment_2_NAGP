import { Component, Prop, State, Watch, Event, EventEmitter, h } from '@stencil/core';

/**
 * A debounced search input. Owns only keystroke-to-debounced-event plumbing;
 * it never calls an API itself — the host app listens for `searchChange` and
 * decides what to do with the value.
 */
@Component({
  tag: 'recipe-ui-search-bar',
  styleUrl: 'recipe-ui-search-bar.css',
  shadow: true,
})
export class RecipeUiSearchBar {
  @Prop() value: string = '';
  @Prop() placeholder: string = 'Search recipes…';
  @Prop() debounceMs: number = 300;

  /** Fired `debounceMs` after the user stops typing, with the current input value. */
  @Event() searchChange: EventEmitter<{ value: string }>;

  @State() private internalValue: string = '';
  private debounceTimer?: ReturnType<typeof setTimeout>;

  componentWillLoad() {
    // Seed from the prop here rather than in the @State initializer: field
    // initializers run at construction, before the lazy-loaded element has had
    // its props assigned, so initializing from `this.value` there silently
    // dropped any starting value the host passed in.
    this.internalValue = this.value;
  }

  @Watch('value')
  onValuePropChange(newValue: string) {
    this.internalValue = newValue;
  }

  private handleInput = (ev: InputEvent) => {
    const value = (ev.target as HTMLInputElement).value;
    this.internalValue = value;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchChange.emit({ value });
    }, this.debounceMs);
  };

  private handleClear = () => {
    this.internalValue = '';
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.searchChange.emit({ value: '' });
  };

  disconnectedCallback() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  render() {
    return (
      <div class="search-bar">
        <svg class="search-bar__icon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          type="search"
          value={this.internalValue}
          placeholder={this.placeholder}
          onInput={this.handleInput}
          aria-label="Search recipes"
        />
        {this.internalValue && (
          <button class="search-bar__clear" type="button" onClick={this.handleClear} aria-label="Clear search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
            </svg>
          </button>
        )}
      </div>
    );
  }
}
