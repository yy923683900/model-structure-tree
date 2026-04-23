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

/** `selectByKey` / `selectByOid` 时的选项：设为 `emit: false` 可只更新内部 UI，不向宿主派发 `mst-select`（如 iframe 反向同步时避免重复业务逻辑）。 */
export interface MstSelectOptions {
  emit?: boolean;
}
