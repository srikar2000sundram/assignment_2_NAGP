import { render, h, describe, it, expect, vi } from '@stencil/vitest';

describe('recipe-ui-modal-dialog — open/close contract', () => {
  it('renders nothing at all while closed', async () => {
    const { root } = await render(<recipe-ui-modal-dialog heading="Pick a recipe"></recipe-ui-modal-dialog>);
    expect(root.shadowRoot.querySelector('.backdrop')).toBeNull();
    expect(root.shadowRoot.querySelector('.dialog')).toBeNull();
  });

  it('closes on backdrop click but not on a click inside the dialog', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={true}></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    (root.shadowRoot.querySelector('.dialog') as HTMLElement).click();
    expect(spy).not.toHaveBeenCalled();

    (root.shadowRoot.querySelector('.backdrop') as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('closes on the close button', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={true}></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    (root.shadowRoot.querySelector('.dialog__close') as HTMLElement).click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape while open', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={true}></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while closed', async () => {
    // The keydown listener is bound to `document`, so it stays live even when
    // the modal renders nothing — it must guard on `open` itself.
    const { root } = await render(<recipe-ui-modal-dialog open={false}></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(spy).not.toHaveBeenCalled();
  });

  it('ignores other keys while open', async () => {
    const { root } = await render(<recipe-ui-modal-dialog open={true}></recipe-ui-modal-dialog>);
    const spy = vi.fn();
    root.addEventListener('close', spy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(spy).not.toHaveBeenCalled();
  });
});

describe('recipe-ui-modal-dialog — content projection', () => {
  it('projects body and footer slots into their own regions', async () => {
    const { root } = await render(
      <recipe-ui-modal-dialog open={true} heading="Pick a recipe">
        <p class="probe-body">Body</p>
        <button slot="footer" class="probe-footer">
          Done
        </button>
      </recipe-ui-modal-dialog>,
    );

    const bodySlot = root.shadowRoot.querySelector('.dialog__body slot') as HTMLSlotElement;
    const footerSlot = root.shadowRoot.querySelector('.dialog__footer slot[name="footer"]') as HTMLSlotElement;

    expect(bodySlot.assignedElements().map((el) => el.className)).toEqual(['probe-body']);
    expect(footerSlot.assignedElements().map((el) => el.className)).toEqual(['probe-footer']);
  });

  it('exposes the heading to assistive tech and omits the <h2> when unset', async () => {
    const { root } = await render(
      <recipe-ui-modal-dialog open={true} heading="Pick a recipe for Monday"></recipe-ui-modal-dialog>,
    );
    const dialog = root.shadowRoot.querySelector('.dialog');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Pick a recipe for Monday');
    expect(root.shadowRoot.querySelector('.dialog__header h2').textContent).toBe('Pick a recipe for Monday');

    const { root: bare } = await render(<recipe-ui-modal-dialog open={true}></recipe-ui-modal-dialog>);
    expect(bare.shadowRoot.querySelector('.dialog__header h2')).toBeNull();
  });

  it('toggles content in and out as `open` flips', async () => {
    const { root, setProps } = await render(<recipe-ui-modal-dialog open={false}></recipe-ui-modal-dialog>);
    expect(root.shadowRoot.querySelector('.dialog')).toBeNull();

    await setProps({ open: true });
    expect(root.shadowRoot.querySelector('.dialog')).not.toBeNull();

    await setProps({ open: false });
    expect(root.shadowRoot.querySelector('.dialog')).toBeNull();
  });
});
