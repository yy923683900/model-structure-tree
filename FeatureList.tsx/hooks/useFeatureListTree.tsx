import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Key } from "react";

import { TreeNodeTitle, type TreeNodeTitleProps } from "../TreeNodeTitle";
import {
  computeSearchExpandedKeys,
  isolateSubtreeVisibility,
  setAllTreeNodesVisible,
  structureInfoToTreeData,
  toggleTreeNodeVisibility,
} from "../treeUtils";
import type { TreeNode } from "../types";

import type { StructureInfo } from "@/stores/types";

export type FeatureListTreeEditHandlers = Pick<
  TreeNodeTitleProps,
  "onEditModel" | "onEditProperties"
>;

export function useFeatureListTree(
  structureInfo: StructureInfo | null,
  editHandlers?: FeatureListTreeEditHandlers
) {
  const treeRef = useRef<any>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  useEffect(() => {
    if (!structureInfo) return;
    const newTreeData = structureInfoToTreeData(structureInfo);
    setTreeData(newTreeData);
    const firstLevelKeys = newTreeData.map((n) => n.key);
    setDefaultExpandedKeys(firstLevelKeys);
    setExpandedKeys(firstLevelKeys);
  }, [structureInfo]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchValue(searchValue), 300);
    return () => clearTimeout(t);
  }, [searchValue]);

  const searchExpandedKeys = useMemo(
    () => computeSearchExpandedKeys(treeData, debouncedSearchValue),
    [debouncedSearchValue, treeData]
  );

  // 无搜索时不能只依赖 searchExpandedKeys：treeData 更新（如显隐切换）会重算 searchExpandedKeys，
  // 而 computeSearchExpandedKeys 在空搜索下每次返回新 []，会误触发把展开态重置为 defaultExpandedKeys。
  useEffect(() => {
    if (!debouncedSearchValue) {
      setExpandedKeys(defaultExpandedKeys);
      setAutoExpandParent(false);
    }
  }, [debouncedSearchValue, defaultExpandedKeys]);

  useEffect(() => {
    if (debouncedSearchValue) {
      setExpandedKeys(searchExpandedKeys);
      setAutoExpandParent(true);
    }
  }, [debouncedSearchValue, searchExpandedKeys]);

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value),
    []
  );

  const onExpand = useCallback((keys: Key[]) => {
    setExpandedKeys(keys);
    setAutoExpandParent(false);
  }, []);

  const toggleVisibility = useCallback((key: string) => {
    setTreeData((prev) => toggleTreeNodeVisibility(prev, key));
  }, []);

  const applySelectionVisibility = useCallback((key: string | null) => {
    setTreeData((prev) =>
      key ? isolateSubtreeVisibility(prev, key) : setAllTreeNodesVisible(prev)
    );
  }, []);

  const renderedTreeData = useMemo(() => {
    const renderTreeNodes = (data: TreeNode[]): any =>
      data.map((item) => {
        const nodeTitle = (
          <TreeNodeTitle
            item={item}
            searchValue={debouncedSearchValue}
            onToggleVisibility={toggleVisibility}
            onEditModel={editHandlers?.onEditModel}
            onEditProperties={editHandlers?.onEditProperties}
          />
        );
        if (item.children?.length) {
          return {
            ...item,
            title: nodeTitle,
            children: renderTreeNodes(item.children),
          };
        }
        return { ...item, title: nodeTitle };
      });
    return renderTreeNodes(treeData);
  }, [treeData, debouncedSearchValue, toggleVisibility, editHandlers]);

  const scrollToTreeNode = useCallback((key: string) => {
    const scroll = () => {
      // top：选中节点对齐到可视区域顶部；offset 保持较小以免贴近底部时触发 rc-virtual-list 的 max 警告
      treeRef.current?.scrollTo({ key, align: "top", offset: 8 });
    };
    // 展开后需等虚拟列表重算高度再滚
    window.setTimeout(() => {
      requestAnimationFrame(scroll);
    }, 100);
  }, []);

  return {
    treeRef,
    treeData,
    selectedKeys,
    setSelectedKeys,
    searchValue,
    handleSearch,
    expandedKeys,
    setExpandedKeys,
    autoExpandParent,
    setAutoExpandParent,
    onExpand,
    renderedTreeData,
    scrollToTreeNode,
    applySelectionVisibility,
  };
}
