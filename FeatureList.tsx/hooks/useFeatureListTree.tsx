import { useCallback, useEffect, useRef, useState } from "react";

import {
  isolateSubtreeVisibility,
  setAllTreeNodesVisible,
  structureInfoToTreeData,
  toggleTreeNodeVisibility,
} from "../treeUtils";
import type { TreeNode } from "../types";

import type { StructureInfo } from "@/stores/types";

/** `mst-feature-tree` 上由 ref 调用的方法（与 @mst-ui/core 保持同步） */
export type MstSelectOptions = { emit?: boolean; isolate?: boolean };

export type MstFeatureTreeElement = HTMLElement & {
  selectByKey: (key: string | null, options?: MstSelectOptions) => void;
  selectByOid: (
    oid: string | number | null,
    options?: MstSelectOptions
  ) => string | null;
  scrollToNode: (key: string) => void;
  resetVisibility: () => void;
  isolateNode: (key: string) => void;
};

export function useFeatureListTree(structureInfo: StructureInfo | null) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const featureTreeRef = useRef<MstFeatureTreeElement | null>(null);

  useEffect(() => {
    if (!structureInfo) return;
    const newTreeData = structureInfoToTreeData(structureInfo);
    setTreeData(newTreeData);
    setSelectedKey(null);
  }, [structureInfo]);

  const applySelectionVisibility = useCallback((key: string | null) => {
    setTreeData((prev) =>
      key ? isolateSubtreeVisibility(prev, key) : setAllTreeNodesVisible(prev)
    );
  }, []);

  const onMstVisibilityChange = useCallback((e: Event) => {
    const d = (e as CustomEvent<{ key: string }>).detail;
    if (!d?.key) return;
    setTreeData((prev) => toggleTreeNodeVisibility(prev, d.key));
  }, []);

  return {
    featureTreeRef,
    treeData,
    selectedKey,
    setSelectedKey,
    applySelectionVisibility,
    onMstVisibilityChange,
  };
}
