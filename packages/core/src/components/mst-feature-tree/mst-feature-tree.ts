import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  chevronRightIcon,
  editIcon,
  eyeClosedIcon,
  eyeOpenIcon,
  searchIcon,
} from './icons';
import { featureTreeStyles } from './styles';
import {
  computeSearchExpandedKeys,
  findKeyByOid,
  findNodeByKey,
  getParentKeysForNode,
  isolateSubtree,
  normalizeTree,
  setAllVisible,
  toggleNodeVisibility,
} from './tree-utils';
import type {
  FeatureTreeEditDetail,
  FeatureTreeExpandDetail,
  FeatureTreeNode,
  FeatureTreeSearchDetail,
  FeatureTreeSelectDetail,
  FeatureTreeVisibilityDetail,
} from './types';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * `<mst-feature-tree>` – A model structure tree (framework-agnostic Web Component).
 *
 * Properties (set via DOM, not attributes unless marked):
 * - `data`          – `FeatureTreeNode[]`, tree source
 * - `selectedKey`   – `string | null`, controlled selection
 * - `searchable`    – `boolean` attribute, show search input (default: true)
 * - `height`        – `number` attribute, scroll area height (default: 750)
 * - `width`         – `number` attribute, container width (default: 500)
 *
 * Events (CustomEvent):
 * - `mst-select`             – `{ key, node }`
 * - `mst-expand`             – `{ expandedKeys }`
 * - `mst-search`             – `{ value }`
 * - `mst-visibility-change`  – `{ key, isVisible, node }`
 * - `mst-edit-model`         – `{ key, node }`
 * - `mst-edit-properties`    – `{ key, node }`
 *
 * Methods:
 * - `selectByKey(key)`   – programmatic selection (scrolls into view)
 * - `selectByOid(oid)`   – select the node whose `id` matches `oid`
 * - `scrollToNode(key)`  – scroll a row into view
 * - `resetVisibility()`  – set all nodes visible
 * - `isolateNode(key)`   – only keep target subtree visible
 */
@customElement('mst-feature-tree')
export class MstFeatureTree extends LitElement {
  static styles = featureTreeStyles;

  @property({ attribute: false })
  data: FeatureTreeNode[] = [];

  @property({ type: String, attribute: 'selected-key' })
  selectedKey: string | null = null;

  @property({ type: Boolean })
  searchable = true;

  @property({ type: Number })
  height = 750;

  @property({ type: Number })
  width = 500;

  @state() private _treeData: FeatureTreeNode[] = [];
  @state() private _expandedKeys = new Set<string>();
  @state() private _selectedKey: string | null = null;
  @state() private _searchValue = '';
  @state() private _debouncedSearch = '';
  @state() private _menuForKey: string | null = null;
  @state() private _menuPos: { top: number; left: number } = { top: 0, left: 0 };

  private _defaultExpanded: string[] = [];
  private _searchTimer?: number;
  private _outsideClickBound?: (e: MouseEvent) => void;

  willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('data')) {
      this._treeData = normalizeTree(this.data ?? []);
      this._defaultExpanded = this._treeData.map((n) => n.key);
      this._expandedKeys = new Set(this._defaultExpanded);
    }
    if (changed.has('selectedKey')) {
      this._selectedKey = this.selectedKey ?? null;
    }
  }

  updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('width')) {
      this.style.setProperty('width', `${this.width}px`);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._searchTimer) window.clearTimeout(this._searchTimer);
    this._unbindOutsideClick();
  }

  // ------------------------------------------------------------------ Public API

  /** Select a node by key. Also expands the path and scrolls into view. */
  selectByKey(key: string | null): void {
    this._selectedKey = key;
    if (key) {
      const parents = getParentKeysForNode(key, this._treeData) ?? [];
      this._expandedKeys = new Set([...this._expandedKeys, ...parents]);
      this._treeData = isolateSubtree(this._treeData, key);
      queueMicrotask(() => this.scrollToNode(key));
    } else {
      this._treeData = setAllVisible(this._treeData);
    }
    this._emitSelect(key);
  }

  /** Select a node by its `id` field. Returns the matched key, if any. */
  selectByOid(oid: string | number | null): string | null {
    if (oid === null || oid === undefined) {
      this.selectByKey(null);
      return null;
    }
    const key = findKeyByOid(oid, this._treeData) ?? null;
    if (key) this.selectByKey(key);
    return key;
  }

  scrollToNode(key: string): void {
    const el = this.renderRoot.querySelector<HTMLElement>(
      `[data-row-key="${CSS.escape(key)}"]`,
    );
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  resetVisibility(): void {
    this._treeData = setAllVisible(this._treeData);
  }

  isolateNode(key: string): void {
    this._treeData = isolateSubtree(this._treeData, key);
  }

  // ------------------------------------------------------------------ Rendering

  render(): TemplateResult {
    return html`
      ${this.searchable ? this._renderSearch() : nothing}
      <div
        class="tree-scroll"
        style=${styleMap({
          maxHeight: `${this.height}px`,
          height: this.searchable
            ? `calc(100% - 56px)`
            : '100%',
        })}
        @click=${this._onScrollAreaClick}
      >
        ${this._treeData.length === 0
          ? html`<div class="empty">暂无数据</div>`
          : html`<ul class="tree-list">
              ${this._treeData.map((n) => this._renderNode(n, 0))}
            </ul>`}
      </div>
      ${this._menuForKey ? this._renderDropdown() : nothing}
    `;
  }

  private _renderSearch(): TemplateResult {
    return html`
      <div class="search-wrap">
        <label class="search-input">
          <span class="icon">${searchIcon}</span>
          <input
            type="text"
            placeholder="搜索"
            .value=${this._searchValue}
            @input=${this._onSearchInput}
          />
        </label>
      </div>
    `;
  }

  private _renderNode(node: FeatureTreeNode, depth: number): TemplateResult {
    const hasChildren = !!node.children?.length;
    const expanded = this._expandedKeys.has(node.key);
    const selected = this._selectedKey === node.key;
    const hidden = node.isVisible === false;

    const indentCells: TemplateResult[] = [];
    for (let i = 0; i < depth; i++) {
      indentCells.push(html`<span class="indent"></span>`);
    }

    return html`
      <li>
        <div
          class="row"
          data-row-key=${node.key}
          aria-selected=${selected}
          @click=${(e: MouseEvent) => this._onRowClick(e, node)}
        >
          ${indentCells}
          <span
            class=${classMap({
              switcher: true,
              expanded,
              leaf: !hasChildren,
            })}
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              if (hasChildren) this._toggleExpand(node.key);
            }}
          >
            ${hasChildren ? chevronRightIcon : ''}
          </span>
          <div class="row-body">
            <div class=${classMap({ title: true, hidden })}>
              ${this._renderTitle(node.title)}
            </div>
            <div class="actions" @click=${(e: MouseEvent) => e.stopPropagation()}>
              <button
                type="button"
                class=${classMap({ 'action-btn': true, muted: hidden })}
                title="编辑"
                @click=${(e: MouseEvent) => this._openEditMenu(e, node.key)}
              >
                ${editIcon}
              </button>
              <button
                type="button"
                class=${classMap({ 'action-btn': true, muted: hidden })}
                title=${node.isVisible ? '隐藏' : '显示'}
                @click=${(e: MouseEvent) => this._toggleVisibility(e, node.key)}
              >
                ${node.isVisible ? eyeOpenIcon : eyeClosedIcon}
              </button>
            </div>
          </div>
        </div>
        ${hasChildren && expanded
          ? html`<ul>
              ${node.children!.map((c) => this._renderNode(c, depth + 1))}
            </ul>`
          : nothing}
      </li>
    `;
  }

  private _renderTitle(title: string): TemplateResult | string {
    const q = this._debouncedSearch;
    if (!q) return title;
    const idx = title.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return title;
    const before = title.substring(0, idx);
    const match = title.substring(idx, idx + q.length);
    const after = title.substring(idx + q.length);
    return html`${before}<span class="match">${match}</span>${after}`;
  }

  private _renderDropdown(): TemplateResult {
    const { top, left } = this._menuPos;
    return html`
      <div class="dropdown" style=${styleMap({ top: `${top}px`, left: `${left}px` })}>
        <div
          class="dropdown-item"
          @click=${() => this._handleEditMenu('model')}
        >
          编辑模型
        </div>
        <div
          class="dropdown-item"
          @click=${() => this._handleEditMenu('properties')}
        >
          编辑属性
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------ Handlers

  private _onScrollAreaClick = (): void => {
    if (this._menuForKey) this._closeEditMenu();
  };

  private _onSearchInput = (e: Event): void => {
    const value = (e.target as HTMLInputElement).value;
    this._searchValue = value;
    this.dispatchEvent(
      new CustomEvent<FeatureTreeSearchDetail>('mst-search', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
    if (this._searchTimer) window.clearTimeout(this._searchTimer);
    this._searchTimer = window.setTimeout(() => {
      this._debouncedSearch = value;
      this._applySearchExpand();
    }, SEARCH_DEBOUNCE_MS);
  };

  private _applySearchExpand(): void {
    if (!this._debouncedSearch) {
      this._expandedKeys = new Set(this._defaultExpanded);
    } else {
      const keys = computeSearchExpandedKeys(
        this._treeData,
        this._debouncedSearch,
      );
      this._expandedKeys = new Set(keys);
    }
    this._emitExpand();
  }

  private _toggleExpand(key: string): void {
    const next = new Set(this._expandedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this._expandedKeys = next;
    this._emitExpand();
  }

  private _toggleVisibility(e: MouseEvent, key: string): void {
    e.stopPropagation();
    this._treeData = toggleNodeVisibility(this._treeData, key);
    const node = findNodeByKey(key, this._treeData);
    if (!node) return;
    this.dispatchEvent(
      new CustomEvent<FeatureTreeVisibilityDetail>('mst-visibility-change', {
        detail: { key, isVisible: node.isVisible !== false, node },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onRowClick(_e: MouseEvent, node: FeatureTreeNode): void {
    const nextKey = this._selectedKey === node.key ? null : node.key;
    this._selectedKey = nextKey;
    if (nextKey) {
      this._treeData = isolateSubtree(this._treeData, nextKey);
    } else {
      this._treeData = setAllVisible(this._treeData);
    }
    this._emitSelect(nextKey);
  }

  private _openEditMenu(e: MouseEvent, key: string): void {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this._menuPos = {
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - 120),
    };
    this._menuForKey = key;
    this._bindOutsideClick();
  }

  private _closeEditMenu(): void {
    this._menuForKey = null;
    this._unbindOutsideClick();
  }

  private _handleEditMenu(kind: 'model' | 'properties'): void {
    const key = this._menuForKey;
    this._closeEditMenu();
    if (!key) return;
    const node = findNodeByKey(key, this._treeData);
    if (!node) return;
    const eventName = kind === 'model' ? 'mst-edit-model' : 'mst-edit-properties';
    this.dispatchEvent(
      new CustomEvent<FeatureTreeEditDetail>(eventName, {
        detail: { key, node },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _bindOutsideClick(): void {
    if (this._outsideClickBound) return;
    this._outsideClickBound = (e: MouseEvent) => {
      const path = e.composedPath();
      const inside = path.some(
        (n) => n instanceof HTMLElement && n.classList.contains('dropdown'),
      );
      if (!inside) this._closeEditMenu();
    };
    window.addEventListener('click', this._outsideClickBound);
  }

  private _unbindOutsideClick(): void {
    if (this._outsideClickBound) {
      window.removeEventListener('click', this._outsideClickBound);
      this._outsideClickBound = undefined;
    }
  }

  private _emitSelect(key: string | null): void {
    const node = key ? findNodeByKey(key, this._treeData) ?? null : null;
    this.dispatchEvent(
      new CustomEvent<FeatureTreeSelectDetail>('mst-select', {
        detail: { key, node },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _emitExpand(): void {
    this.dispatchEvent(
      new CustomEvent<FeatureTreeExpandDetail>('mst-expand', {
        detail: { expandedKeys: [...this._expandedKeys] },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mst-feature-tree': MstFeatureTree;
  }
}
