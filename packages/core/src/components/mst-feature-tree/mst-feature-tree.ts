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
  flattenVisibleTree,
  getParentKeysForNode,
  getTreeKeysStructureSignature,
  isolateSubtree,
  normalizeTree,
  setAllVisible,
  toggleNodeVisibility,
} from './tree-utils';
import type { FlatRow } from './tree-utils';
import type {
  FeatureTreeEditDetail,
  FeatureTreeExpandDetail,
  FeatureTreeNode,
  FeatureTreeSearchDetail,
  FeatureTreeSelectDetail,
  FeatureTreeVisibilityDetail,
  MstSelectOptions,
} from './types';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * `<mst-feature-tree>` – A model structure tree (framework-agnostic Web Component).
 *
 * Properties (set via DOM, not attributes unless marked):
 * - `data`            – `FeatureTreeNode[]`, tree source
 * - `selectedKey`     – `string | null`, controlled selection
 * - `searchable`      – `boolean` attribute, show search input (default: true)
 * - `height`          – `number` attribute, scroll area height (default: 750)
 * - `width`           – `number` attribute, host width in px when not `fullWidth` (default: 500)
 * - `fullWidth`       – `boolean` attribute, host width 100% (default: false)
 * - `allowDeselect`  – `boolean` attribute, click same row to clear selection (default: false)
 * - `showEdit`        – `boolean` attribute, show per-row edit button + dropdown
 *                       (编辑模型 / 编辑属性) (default: false)
 * - `highlightKey`    – `string | null` attribute `highlight-key`; 蓝色高亮唯一节点，
 *                       可与选中态叠加；key 变化时自动展开父级并滚动定位 (default: null)
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
 * - `selectByKey(key, { emit? })` – programmatic selection; `emit: false` 不触发 `mst-select`
 * - `selectByOid(oid, { emit? })` – 同 `id` 选中
 * - `scrollToNode(key)`  – scroll a row into view
 * - `resetVisibility()`  – set all nodes visible
 * - `isolateNode(key)`   – only keep target subtree visible
 *
 * Rendering notes:
 * - Built-in virtual scrolling: the tree is flattened to visible rows and only
 *   the viewport window (plus overscan) is rendered, so trees with tens of
 *   thousands of nodes stay responsive.
 * - Requires a uniform row height (`--mst-row-height`, default 40px);
 *   `scrollToNode` and the virtual window math rely on it.
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

  @property({ type: Boolean, attribute: 'full-width' })
  fullWidth = false;

  @property({ type: Boolean, attribute: 'allow-deselect' })
  allowDeselect = false;

  @property({ type: Boolean, attribute: 'show-edit' })
  showEdit = false;

  @property({ type: String, attribute: 'highlight-key' })
  highlightKey: string | null = null;

  @state() private _treeData: FeatureTreeNode[] = [];
  @state() private _expandedKeys = new Set<string>();
  @state() private _selectedKey: string | null = null;
  @state() private _highlightKey: string | null = null;
  @state() private _searchValue = '';
  @state() private _debouncedSearch = '';
  @state() private _menuForKey: string | null = null;
  @state() private _menuPos: { top: number; left: number } = { top: 0, left: 0 };
  /** 拍平后的可见行（含 depth），供虚拟滚动渲染。 */
  @state() private _flatRows: FlatRow[] = [];
  /** 滚动容器当前 scrollTop，驱动虚拟窗口计算。 */
  @state() private _scrollTop = 0;
  /** 滚动容器视口高度，由 ResizeObserver 维护。 */
  @state() private _viewportHeight = 0;

  /** key → 行号，用于 `scrollToNode` 定位。 */
  private _rowIndexByKey = new Map<string, number>();
  /** 行高（px），取自 `--mst-row-height`；虚拟滚动的行高基准。 */
  private _rowHeight = 40;
  /** 虚拟滚动窗口上下各多渲染的行数，滚动更平滑。 */
  private static readonly OVERSCAN_ROWS = 10;
  private _scrollRaf?: number;
  private _resizeObserver?: ResizeObserver;
  private _defaultExpanded: string[] = [];
  /** 上次 `data` 的键结构签名；结构未变时（如仅显隐）保留展开与搜索展开结果 */
  private _lastDataStructureSig = '';
  private _searchTimer?: number;
  private _outsideClickBound?: (e: MouseEvent) => void;

  willUpdate(changed: Map<PropertyKey, unknown>): void {
    let treeDataChanged = false;
    let expandedKeysChanged = false;
    if (changed.has('data')) {
      const raw = this.data ?? [];
      const nextSig = getTreeKeysStructureSignature(raw);
      this._treeData = normalizeTree(raw);
      if (
        this._lastDataStructureSig === '' ||
        nextSig !== this._lastDataStructureSig
      ) {
        this._defaultExpanded = this._treeData.map((n) => n.key);
        this._expandedKeys = new Set(this._defaultExpanded);
      }
      this._lastDataStructureSig = nextSig;
      treeDataChanged = true;
    }
    if (changed.has('selectedKey')) {
      this._selectedKey = this.selectedKey ?? null;
    }
    // 高亮由 `highlightKey` 完全受控，与选中态互不影响；key 变化时自动
    // 展开父级并滚动定位。需在 data 分支之后执行，父级查找基于新树。
    if (changed.has('highlightKey')) {
      const next = this.highlightKey ?? null;
      this._highlightKey = next;
      if (next) {
        const parents = getParentKeysForNode(next, this._treeData) ?? [];
        if (parents.length) {
          this._expandedKeys = new Set([...this._expandedKeys, ...parents]);
          expandedKeysChanged = true;
        }
        queueMicrotask(() => this.scrollToNode(next));
      }
    }
    // willUpdate 内的赋值不会引发新的更新周期（Lit 在 update() 末尾才把
    // isUpdatePending 置回 false 并清空 changed 表），因此 data 分支必须
    // 靠 treeDataChanged 在本周期重算；`changed.has(...)` 捕捉的则是事件
    // 处理器 / 公开方法在周期外对 `_treeData`、`_expandedKeys` 的改写。
    if (
      treeDataChanged ||
      expandedKeysChanged ||
      changed.has('_treeData') ||
      changed.has('_expandedKeys')
    ) {
      this._recomputeFlatRows();
    }
  }

  private _recomputeFlatRows(): void {
    this._flatRows = flattenVisibleTree(this._treeData, this._expandedKeys);
    const index = new Map<string, number>();
    for (let i = 0; i < this._flatRows.length; i++) {
      index.set(this._flatRows[i].node.key, i);
    }
    this._rowIndexByKey = index;
  }

  private _refreshRowHeight(): void {
    const parsed = parseFloat(
      getComputedStyle(this).getPropertyValue('--mst-row-height'),
    );
    if (Number.isFinite(parsed) && parsed > 0) this._rowHeight = parsed;
  }

  firstUpdated(changed: Map<PropertyKey, unknown>): void {
    super.firstUpdated(changed);
    this._syncHostWidth();
    this._refreshRowHeight();
    const sc = this.renderRoot.querySelector<HTMLElement>('.tree-scroll');
    if (sc) {
      this._viewportHeight = sc.clientHeight;
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => {
          this._viewportHeight = sc.clientHeight;
        });
        this._resizeObserver.observe(sc);
      }
    }
  }

  updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('width') || changed.has('fullWidth')) {
      this._syncHostWidth();
    }
  }

  private _syncHostWidth(): void {
    if (this.fullWidth) {
      this.style.setProperty('width', '100%');
      this.style.setProperty('min-width', '0');
    } else {
      this.style.setProperty('width', `${this.width}px`);
      this.style.removeProperty('min-width');
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._searchTimer) window.clearTimeout(this._searchTimer);
    this._unbindOutsideClick();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    if (this._scrollRaf !== undefined) {
      cancelAnimationFrame(this._scrollRaf);
      this._scrollRaf = undefined;
    }
  }

  // ------------------------------------------------------------------ Public API

  /**
   * Select a node by key. Also expands the path and scrolls into view.
   * @param options.emit 为 `false` 时不向宿主派发 `mst-select`。
   * @param options.isolate 为 `false` 时仅定位（展开+滚动+选中态），不改变显隐状态；
   *   取消选中（`key === null`）时也不会 `resetVisibility`。默认 `true`。
   */
  selectByKey(
    key: string | null,
    options: MstSelectOptions = {},
  ): void {
    const isolate = options.isolate !== false;
    this._selectedKey = key;
    if (key) {
      const parents = getParentKeysForNode(key, this._treeData) ?? [];
      this._expandedKeys = new Set([...this._expandedKeys, ...parents]);
      if (isolate) {
        this._treeData = isolateSubtree(this._treeData, key);
      }
      queueMicrotask(() => this.scrollToNode(key));
    } else if (isolate) {
      this._treeData = setAllVisible(this._treeData);
    }
    if (options.emit !== false) {
      this._emitSelect(key);
    }
  }

  /** Select a node by its `id` field. Returns the matched key, if any. */
  selectByOid(
    oid: string | number | null,
    options: MstSelectOptions = {},
  ): string | null {
    if (oid === null || oid === undefined) {
      this.selectByKey(null, options);
      return null;
    }
    const key = findKeyByOid(oid, this._treeData) ?? null;
    if (key) this.selectByKey(key, options);
    return key;
  }

  scrollToNode(key: string): void {
    const index = this._rowIndexByKey.get(key);
    if (index === undefined) return;
    const sc = this.renderRoot.querySelector<HTMLElement>('.tree-scroll');
    if (!sc) return;
    const top = Math.max(0, index * this._rowHeight);
    if (Math.abs(sc.scrollTop - top) < 0.5) return;
    sc.scrollTo({ top, behavior: 'smooth' });
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
        @scroll=${this._onScroll}
      >
        ${this._flatRows.length === 0
          ? html`<div class="empty">暂无数据</div>`
          : this._renderWindow()}
      </div>
      ${this._menuForKey ? this._renderDropdown() : nothing}
    `;
  }

  /**
   * 自实现虚拟滚动：`.virtual-spacer` 撑起总高度产生真实滚动条，
   * `.virtual-window` 平移到窗口起点，仅渲染视口内（含 overscan）的行。
   */
  private _renderWindow(): TemplateResult {
    const total = this._flatRows.length;
    const rowH = this._rowHeight;
    const overscan = MstFeatureTree.OVERSCAN_ROWS;
    const viewportH = this._viewportHeight || this.height;
    const start = Math.max(0, Math.floor(this._scrollTop / rowH) - overscan);
    const end = Math.min(
      total,
      Math.ceil((this._scrollTop + viewportH) / rowH) + overscan,
    );
    const rows = this._flatRows.slice(start, end);
    return html`
      <div
        class="virtual-spacer"
        style=${styleMap({ height: `${total * rowH}px` })}
      >
        <div
          class="virtual-window"
          style=${styleMap({ transform: `translateY(${start * rowH}px)` })}
        >
          ${rows.map((r) => this._renderRow(r.node, r.depth))}
        </div>
      </div>
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

  private _renderRow(node: FeatureTreeNode, depth: number): TemplateResult {
    const hasChildren = !!node.children?.length;
    const expanded = this._expandedKeys.has(node.key);
    const selected = this._selectedKey === node.key;
    const highlighted = node.key === this._highlightKey;
    const hidden = node.isVisible === false;

    const indentCells: TemplateResult[] = [];
    for (let i = 0; i < depth; i++) {
      indentCells.push(html`<span class="indent"></span>`);
    }

    return html`
      <div
        class="row"
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
          <div
            class=${classMap({
              title: true,
              hidden,
              highlighted,
            })}
          >
            ${this._renderTitle(node.title)}
          </div>
          <div class="actions" @click=${(e: MouseEvent) => e.stopPropagation()}>
            ${this.showEdit
              ? html`
                  <button
                    type="button"
                    class=${classMap({ 'action-btn': true, muted: hidden })}
                    title="编辑"
                    @click=${(e: MouseEvent) => this._openEditMenu(e, node.key)}
                  >
                    ${editIcon}
                  </button>
                `
              : nothing}
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

  private _onScroll = (e: Event): void => {
    const el = e.currentTarget as HTMLElement;
    if (this._scrollRaf !== undefined) return;
    this._scrollRaf = requestAnimationFrame(() => {
      this._scrollRaf = undefined;
      this._viewportHeight = el.clientHeight || this._viewportHeight;
      this._scrollTop = el.scrollTop;
    });
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
    const nextKey =
      this._selectedKey === node.key
        ? this.allowDeselect
          ? null
          : node.key
        : node.key;
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
