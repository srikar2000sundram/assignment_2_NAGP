import { Component, Prop, Event, EventEmitter, Listen, h } from '@stencil/core';

/**
 * A generic modal shell. Used as the meal-plan recipe picker: the host app
 * puts a `<recipe-ui-card>` grid in the default slot and, optionally, action
 * buttons in the `footer` slot.
 *
 * @slot - Modal body content.
 * @slot footer - Modal footer, typically action buttons.
 */
@Component({
  tag: 'recipe-ui-modal-dialog',
  styleUrl: 'recipe-ui-modal-dialog.css',
  shadow: true,
})
export class RecipeUiModalDialog {
  @Prop() open: boolean = false;
  @Prop() heading?: string;

  /** Fired when the backdrop, close button, or Escape key requests the modal be closed. Host app owns the `open` prop and should flip it to false. */
  @Event() close: EventEmitter<void>;

  private handleClose = () => this.close.emit();

  private handleBackdropClick = (ev: MouseEvent) => {
    if (ev.target === ev.currentTarget) this.handleClose();
  };

  @Listen('keydown', { target: 'document' })
  handleKeyDown(ev: KeyboardEvent) {
    if (this.open && ev.key === 'Escape') this.handleClose();
  }

  render() {
    if (!this.open) return null;
    return (
      <div class="backdrop" onClick={this.handleBackdropClick}>
        <div class="dialog" role="dialog" aria-modal="true" aria-label={this.heading}>
          <header class="dialog__header">
            {this.heading && <h2>{this.heading}</h2>}
            <button type="button" class="dialog__close" onClick={this.handleClose} aria-label="Close dialog">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
              </svg>
            </button>
          </header>
          <div class="dialog__body">
            <slot></slot>
          </div>
          <footer class="dialog__footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    );
  }
}
