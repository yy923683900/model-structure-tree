import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface MstTreeNode {
  key: string;
  label: string;
  children?: MstTreeNode[];
}

/**
 * `<mst-tree>` – A minimal model-structure tree.
 *
 * Property `data` accepts an array of {@link MstTreeNode}. Because arrays
 * cannot be set via attributes, consumers must set it via the DOM property
 * (React/Vue wrappers take care of that for you).
 *
 * @fires mst-select - CustomEvent<{ node: MstTreeNode }>
 */
@customElement('mst-tree')
export class MstTree extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: inherit;
      font-size: 14px;
      color: #333;
    }
    ul {
      list-style: none;
      padding-left: 16px;
      margin: 0;
    }
    .node {
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      user-select: none;
    }
    .node:hover {
      background: #f0f7ff;
    }
    .node[aria-selected='true'] {
      background: #e6f4ff;
      color: #1677ff;
    }
    .toggle {
      display: inline-block;
      width: 14px;
      text-align: center;
      color: #888;
    }
  `;

  @property({ attribute: false })
  data: MstTreeNode[] = [];

  @state()
  private _expanded = new Set<string>();

  @state()
  private _selected: string | null = null;

  private _toggle(key: string) {
    const next = new Set(this._expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this._expanded = next;
  }

  private _select(node: MstTreeNode) {
    this._selected = node.key;
    this.dispatchEvent(
      new CustomEvent('mst-select', {
        detail: { node },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _renderNode(node: MstTreeNode): unknown {
    const hasChildren = !!node.children?.length;
    const expanded = this._expanded.has(node.key);
    return html`
      <li>
        <div
          class="node"
          aria-selected=${this._selected === node.key}
          @click=${() => this._select(node)}
        >
          <span
            class="toggle"
            @click=${(e: Event) => {
              e.stopPropagation();
              if (hasChildren) this._toggle(node.key);
            }}
            >${hasChildren ? (expanded ? '▾' : '▸') : ''}</span
          >
          ${node.label}
        </div>
        ${hasChildren && expanded
          ? html`<ul>
              ${node.children!.map((c) => this._renderNode(c))}
            </ul>`
          : nothing}
      </li>
    `;
  }

  render() {
    if (!this.data?.length) return html`<slot>No data</slot>`;
    return html`<ul>
      ${this.data.map((n) => this._renderNode(n))}
    </ul>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mst-tree': MstTree;
  }
}
