import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-modal-dialog', () => {
  it('renders nothing when closed', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={false}></recipe-ui-modal-dialog>);
    expect(root.shadowRoot.querySelector('.backdrop')).toBeNull();
  });

  it('renders the heading and body slot when open', async () => {
    const { root } = await render(
      <recipe-ui-modal-dialog open={true} heading="Pick a recipe">
        <p>body content</p>
      </recipe-ui-modal-dialog>,
    );
    expect(root.shadowRoot.querySelector('.dialog__header h2').textContent).toBe('Pick a recipe');
  });

  it('emits close when the close button is clicked', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={true} heading="Pick a recipe"></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    (root.shadowRoot.querySelector('.dialog__close') as HTMLElement).click();

    expect(spy).toHaveBeenCalled();
  });

  it('emits close when the backdrop (not the dialog) is clicked', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={true}></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    root.shadowRoot.querySelector('.backdrop').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(spy).toHaveBeenCalled();
  });
});
