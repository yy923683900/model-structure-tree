import type { FeatureTreeNode } from './types';

/** Deep-clone and normalize visibility (defaults to true) across the tree. */
export function normalizeTree(data: FeatureTreeNode[]): FeatureTreeNode[] {
  return data.map((n) => ({
    ...n,
    isVisible: n.isVisible ?? true,
    children: n.children ? normalizeTree(n.children) : undefined,
  }));
}

export function findNodeByKey(
  key: string,
  nodes: FeatureTreeNode[],
): FeatureTreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children?.length) {
      const found = findNodeByKey(key, node.children);
      if (found) return found;
    }
  }
  return undefined;
}

export function findKeyByOid(
  oid: string | number,
  nodes: FeatureTreeNode[],
): string | undefined {
  for (const node of nodes) {
    if (
      node.id !== undefined &&
      (node.id === oid || String(node.id) === String(oid))
    ) {
      return node.key;
    }
    if (node.children?.length) {
      const found = findKeyByOid(oid, node.children);
      if (found) return found;
    }
  }
  return undefined;
}

export function getParentKeysForNode(
  targetKey: string,
  nodes: FeatureTreeNode[],
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    if (node.key === targetKey) return path;
    if (node.children?.length) {
      const result = getParentKeysForNode(targetKey, node.children, [
        ...path,
        node.key,
      ]);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Collect ALL ancestor keys of every node whose title matches the search
 * query, so the matched node is visible (not hidden behind a collapsed
 * ancestor).
 */
export function computeSearchExpandedKeys(
  treeData: FeatureTreeNode[],
  debouncedSearch: string,
): string[] {
  if (!debouncedSearch) return [];
  const expandKeys = new Set<string>();
  const q = debouncedSearch.toLowerCase();

  const walk = (nodes: FeatureTreeNode[], ancestors: string[]): void => {
    for (const node of nodes) {
      if (node.title.toLowerCase().includes(q)) {
        for (const a of ancestors) expandKeys.add(a);
      }
      if (node.children?.length) {
        walk(node.children, [...ancestors, node.key]);
      }
    }
  };

  walk(treeData, []);
  return [...expandKeys];
}

function cascadeVisibility(
  children: FeatureTreeNode[],
  isVisible: boolean,
): FeatureTreeNode[] {
  return children.map((c) => ({
    ...c,
    isVisible,
    children: c.children ? cascadeVisibility(c.children, isVisible) : undefined,
  }));
}

/** Toggle a node's visibility; the new value cascades to its descendants. */
export function toggleNodeVisibility(
  data: FeatureTreeNode[],
  key: string,
): FeatureTreeNode[] {
  return data.map((node) => {
    if (node.key === key) {
      const next = !node.isVisible;
      return {
        ...node,
        isVisible: next,
        children: node.children
          ? cascadeVisibility(node.children, next)
          : undefined,
      };
    }
    if (node.children?.length) {
      return { ...node, children: toggleNodeVisibility(node.children, key) };
    }
    return node;
  });
}

function showAllUnder(nodes: FeatureTreeNode[]): FeatureTreeNode[] {
  return nodes.map((n) => ({
    ...n,
    isVisible: true,
    children: n.children ? showAllUnder(n.children) : undefined,
  }));
}

/**
 * Only the target node and its descendants are visible; every other node is
 * hidden (including ancestors and siblings).
 */
export function isolateSubtree(
  data: FeatureTreeNode[],
  targetKey: string,
): FeatureTreeNode[] {
  return data.map((node) => {
    if (node.key === targetKey) {
      return {
        ...node,
        isVisible: true,
        children: node.children ? showAllUnder(node.children) : undefined,
      };
    }
    if (node.children?.length) {
      return {
        ...node,
        isVisible: false,
        children: isolateSubtree(node.children, targetKey),
      };
    }
    return { ...node, isVisible: false };
  });
}

export function setAllVisible(data: FeatureTreeNode[]): FeatureTreeNode[] {
  return data.map((n) => ({
    ...n,
    isVisible: true,
    children: n.children ? setAllVisible(n.children) : undefined,
  }));
}

/** 仅当「键结构」与父子关系变化时与另一棵树不同，用于区分配列更新 / 显隐等叶子属性更新 */
function treeKeysStructure(
  n: FeatureTreeNode,
): [string, unknown] | [string, null] {
  if (!n.children?.length) return [n.key, null];
  return [n.key, n.children.map((c) => treeKeysStructure(c))];
}

export function getTreeKeysStructureSignature(
  data: FeatureTreeNode[],
): string {
  return JSON.stringify(data.map((n) => treeKeysStructure(n)));
}

/** 一行 = 树在「展开状态」下实际可见的一个节点，depth 用于缩进。 */
export interface FlatRow {
  node: FeatureTreeNode;
  depth: number;
}

/**
 * 按显示顺序把树拍平成行列表，只为「已展开」的节点继续下钻。
 * 供虚拟滚动使用：DOM 只渲染视口内的行，数据层始终全量。
 */
export function flattenVisibleTree(
  nodes: FeatureTreeNode[],
  expandedKeys: Set<string>,
  depth = 0,
  out: FlatRow[] = [],
): FlatRow[] {
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length && expandedKeys.has(node.key)) {
      flattenVisibleTree(node.children, expandedKeys, depth + 1, out);
    }
  }
  return out;
}
