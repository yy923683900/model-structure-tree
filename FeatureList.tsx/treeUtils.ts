import type { StructureInfo } from "@/stores/types";
import type { Key } from "react";

import type { TreeNode } from "./types";

/** 与接口数据实际树形一致；StructureInfoChildren.children 在 types 中误标为 StructureInfo[] */
type StructureTreeChild = {
  name: string;
  id?: number;
  bbox?: number[];
  children?: StructureTreeChild[];
};

export function structureInfoToTreeData(structureInfo: StructureInfo): TreeNode[] {
  const treeIndex = structureInfo.defaultTree || 0;
  const tree = structureInfo.trees[treeIndex];
  if (!tree) return [];

  const convertChildren = (
    children: StructureTreeChild[],
    parentKey = ""
  ): TreeNode[] =>
    children.map((child, index) => {
      const key = parentKey ? `${parentKey}-${index}` : `${index}`;
      const node: TreeNode = {
        title: child.name,
        key,
        isVisible: true,
        bbox: child.bbox,
        id: child.id,
      };

      if (child.children && child.children.length > 0) {
        node.children = convertChildren(child.children, key);
      }

      return node;
    });

  return convertChildren(tree.children as StructureTreeChild[]);
}

export function findNodeDataByKey(
  key: string,
  nodes: TreeNode[]
): { bbox?: number[]; id?: string | number } | undefined {
  try {
    for (const node of nodes) {
      if (node.key === key) {
        return {
          bbox: Array.isArray(node.bbox) ? node.bbox : undefined,
          id: node.id,
        };
      }
      if (node.children?.length) {
        const found = findNodeDataByKey(key, node.children);
        if (found) return found;
      }
    }
  } catch (e) {
    console.error("查找节点数据时出错:", e);
  }
  return undefined;
}

export function findFullNodeByKey(
  key: string,
  nodes: TreeNode[]
): TreeNode | undefined {
  try {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children?.length) {
        const found = findFullNodeByKey(key, node.children);
        if (found) return found;
      }
    }
  } catch (e) {
    console.error("查找完整节点数据时出错:", e);
  }
  return undefined;
}

export function findKeyByOid(
  oid: string | number,
  nodes: TreeNode[]
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
  nodes: TreeNode[],
  path: string[] = []
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

export function computeSearchExpandedKeys(
  treeData: TreeNode[],
  debouncedSearch: string
): Key[] {
  if (!debouncedSearch) return [];
  const expandKeys: Key[] = [];
  const q = debouncedSearch.toLowerCase();

  const walk = (nodes: TreeNode[], parentKey?: string) => {
    nodes.forEach((node) => {
      if (node.title.toLowerCase().includes(q) && parentKey) {
        expandKeys.push(parentKey);
      }
      if (node.children?.length) walk(node.children, node.key);
    });
  };

  walk(treeData);
  return [...new Set(expandKeys)];
}

function updateChildrenVisibility(
  children: TreeNode[],
  isVisible: boolean
): TreeNode[] {
  return children.map((child) => ({
    ...child,
    isVisible,
    children: child.children
      ? updateChildrenVisibility(child.children, isVisible)
      : undefined,
  }));
}

export function toggleTreeNodeVisibility(
  treeData: TreeNode[],
  key: string
): TreeNode[] {
  const updateTree = (list: TreeNode[]): TreeNode[] =>
    list.map((node) => {
      if (node.key === key) {
        const next = !node.isVisible;
        if (node.children?.length) {
          return {
            ...node,
            isVisible: next,
            children: updateChildrenVisibility(node.children, next),
          };
        }
        return { ...node, isVisible: next };
      }
      if (node.children?.length) {
        return { ...node, children: updateTree(node.children) };
      }
      return node;
    });

  return updateTree(treeData);
}

function showSubtreeAllVisible(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    isVisible: true,
    children: node.children
      ? showSubtreeAllVisible(node.children)
      : undefined,
  }));
}

/** 仅目标节点及其后代为显示，其余节点全部隐藏（祖先节点也为隐藏）。 */
export function isolateSubtreeVisibility(
  treeData: TreeNode[],
  targetKey: string
): TreeNode[] {
  return treeData.map((node) => {
    if (node.key === targetKey) {
      return {
        ...node,
        isVisible: true,
        children: node.children
          ? showSubtreeAllVisible(node.children)
          : undefined,
      };
    }
    if (node.children?.length) {
      return {
        ...node,
        isVisible: false,
        children: isolateSubtreeVisibility(node.children, targetKey),
      };
    }
    return { ...node, isVisible: false };
  });
}

export function setAllTreeNodesVisible(treeData: TreeNode[]): TreeNode[] {
  return treeData.map((node) => ({
    ...node,
    isVisible: true,
    children: node.children
      ? setAllTreeNodesVisible(node.children)
      : undefined,
  }));
}
