export interface FeatureTreeNode {
  /** Unique key within the whole tree. */
  key: string;
  /** Display text. */
  title: string;
  /** Whether the node (and its subtree) is currently visible. Default: true. */
  isVisible?: boolean;
  /** Optional business id forwarded in every event. */
  id?: string | number;
  /** Optional bbox forwarded in every event. */
  bbox?: number[];
  /** Children nodes. */
  children?: FeatureTreeNode[];
}

export interface FeatureTreeSelectDetail {
  key: string | null;
  node: FeatureTreeNode | null;
}

export interface FeatureTreeVisibilityDetail {
  key: string;
  isVisible: boolean;
  node: FeatureTreeNode;
}

export interface FeatureTreeEditDetail {
  key: string;
  node: FeatureTreeNode;
}

export interface FeatureTreeExpandDetail {
  expandedKeys: string[];
}

export interface FeatureTreeSearchDetail {
  value: string;
}

/**
 * `selectByKey` / `selectByOid` 时的选项。
 * - `emit`：设为 `false` 仅更新内部 UI，不向宿主派发 `mst-select`（例如 iframe 反向同步时避免重复执行业务逻辑）。
 * - `isolate`：设为 `false` 仅定位/高亮该行（展开父级、滚动到视口、更新选中态），不改变当前节点的显隐状态；
 *   取消选中（`key/oid === null`）时设为 `false` 也不会重置所有节点可见性。默认 `true`。
 */
export interface MstSelectOptions {
  emit?: boolean;
  isolate?: boolean;
}
