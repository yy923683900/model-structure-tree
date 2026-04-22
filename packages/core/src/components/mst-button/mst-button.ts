import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type MstButtonVariant = 'primary' | 'default' | 'danger';

/**
 * `<mst-button>` – A minimal cross-framework button.
 *
 * @attr variant   - Visual style: `primary` | `default` | `danger`
 * @attr disabled  - Boolean attribute
 * @fires mst-click - CustomEvent<{ originalEvent: MouseEvent }>
 * @slot            - Default button content
 */
@customElement('mst-button')
export class MstButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      font-family: inherit;
    }
    button {
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 6px 14px;
      font: inherit;
      line-height: 1.5;
      transition: background 0.15s, border-color 0.15s;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .default {
      background: #fff;
      border-color: #d9d9d9;
      color: #333;
    }
    .default:hover:not(:disabled) {
      border-color: #4096ff;
      color: #4096ff;
    }
    .primary {
      background: #1677ff;
      color: #fff;
    }
    .primary:hover:not(:disabled) {
      background: #4096ff;
    }
    .danger {
      background: #ff4d4f;
      color: #fff;
    }
    .danger:hover:not(:disabled) {
      background: #ff7875;
    }
  `;

  @property({ type: String })
  variant: MstButtonVariant = 'default';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  private _onClick = (e: MouseEvent) => {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('mst-click', {
        detail: { originalEvent: e },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <button
        class=${this.variant}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mst-button': MstButton;
  }
}
