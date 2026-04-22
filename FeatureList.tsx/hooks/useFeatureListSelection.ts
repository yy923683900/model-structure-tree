import { message } from "antd";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Key } from "react";

import {
  postCancelFeatureTransformEditToIframe,
  postClearHighlightToFeatureIframe,
  postHighlightToFeatureIframe,
  postStartFeatureTransformEditToIframe,
} from "../featureIframe";
import {
  findKeyByOid,
  findNodeDataByKey,
  getParentKeysForNode,
} from "../treeUtils";
import type { TreeNode } from "../types";

import type { ConvertorStore } from "@/stores/convertor";

type FindParquet = (nodeId: string | number) => any | null;

function cloneRow(row: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

export function useFeatureListSelection(
  convertorStore: ConvertorStore,
  treeData: TreeNode[],
  findParquetDataByOid: FindParquet,
  setSelectedKeys: (k: Key[]) => void,
  setExpandedKeys: Dispatch<SetStateAction<Key[]>>,
  setAutoExpandParent: (v: boolean) => void,
  scrollToTreeNode: (key: string) => void,
  applySelectionVisibility: (nodeKey: string | null) => void
) {
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [propertyModalData, setPropertyModalData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const mapLoc = convertorStore.mapLocationEnabled;

  const openPropertyEditorForNodeKey = useCallback(
    (nodeKey: string) => {
      const nodeData = findNodeDataByKey(nodeKey, treeData);
      if (nodeData?.id === undefined || nodeData.id === null) {
        message.warning("该节点没有构件 id，无法编辑属性");
        return;
      }
      const parquetRow = findParquetDataByOid(nodeData.id);
      if (!parquetRow || typeof parquetRow !== "object") {
        message.warning("未找到该构件的属性数据");
        return;
      }
      setSelectedKeys([nodeKey]);
      applySelectionVisibility(nodeKey);
      convertorStore.setSelectedFeature(nodeData.id, nodeData.bbox);
      setPropertyModalData(cloneRow(parquetRow as Record<string, unknown>));
      setPropertyModalVisible(true);
      postCancelFeatureTransformEditToIframe(mapLoc);
      setTimeout(
        () => postHighlightToFeatureIframe(mapLoc, nodeData.id!, nodeData.bbox),
        100
      );
    },
    [
      applySelectionVisibility,
      convertorStore,
      findParquetDataByOid,
      mapLoc,
      setSelectedKeys,
      treeData,
    ]
  );

  const openModelEditorForNodeKey = useCallback(
    (nodeKey: string) => {
      const nodeData = findNodeDataByKey(nodeKey, treeData);
      if (nodeData?.id === undefined || nodeData.id === null) {
        message.warning("该节点没有构件 id，无法编辑模型");
        return;
      }
      setSelectedKeys([nodeKey]);
      applySelectionVisibility(nodeKey);
      convertorStore.setSelectedFeature(nodeData.id, nodeData.bbox);
      setTimeout(
        () => postHighlightToFeatureIframe(mapLoc, nodeData.id!, nodeData.bbox),
        100
      );
      setTimeout(
        () => postStartFeatureTransformEditToIframe(mapLoc, nodeData.id!),
        150
      );
    },
    [applySelectionVisibility, convertorStore, mapLoc, setSelectedKeys, treeData]
  );

  const onSelect = useCallback(
    (keys: Key[]) => {
      setSelectedKeys(keys);
      setPropertyModalVisible(false);
      setPropertyModalData(null);
      postCancelFeatureTransformEditToIframe(mapLoc);
      if (keys.length > 0) {
        const key = keys[0].toString();
        applySelectionVisibility(key);
        const nodeData = findNodeDataByKey(key, treeData);

        if (nodeData?.id !== undefined && nodeData.id !== null) {
          convertorStore.setSelectedFeature(nodeData.id, nodeData.bbox);
          setTimeout(
            () =>
              postHighlightToFeatureIframe(mapLoc, nodeData.id!, nodeData.bbox),
            100
          );
        } else {
          console.warn("节点数据无效或缺少 id:", nodeData);
        }
      } else {
        applySelectionVisibility(null);
        convertorStore.clearSelectedFeature();
        setPropertyModalVisible(false);
        setPropertyModalData(null);
        setTimeout(() => postClearHighlightToFeatureIframe(mapLoc), 100);
      }
    },
    [applySelectionVisibility, convertorStore, mapLoc, setSelectedKeys, treeData]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "featureClicked") return;

      const { oid } = event.data;
      if (oid === null || oid === undefined) {
        setSelectedKeys([]);
        applySelectionVisibility(null);
        setPropertyModalVisible(false);
        setPropertyModalData(null);
        convertorStore.clearSelectedFeature();
        postCancelFeatureTransformEditToIframe(mapLoc);
        return;
      }

      const targetKey = findKeyByOid(oid, treeData);
      if (!targetKey) return;

      const parentKeys = getParentKeysForNode(targetKey, treeData) || [];
      setExpandedKeys((prev) => Array.from(new Set([...prev, ...parentKeys])));
      setAutoExpandParent(true);
      setSelectedKeys([targetKey]);
      applySelectionVisibility(targetKey);

      const nodeData = findNodeDataByKey(targetKey, treeData);
      if (nodeData?.id !== undefined) {
        convertorStore.setSelectedFeature(nodeData.id, null);
      }

      scrollToTreeNode(targetKey);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    applySelectionVisibility,
    convertorStore,
    mapLoc,
    scrollToTreeNode,
    setAutoExpandParent,
    setExpandedKeys,
    setSelectedKeys,
    treeData,
  ]);

  const closePropertyModal = useCallback(() => {
    setPropertyModalVisible(false);
    setPropertyModalData(null);
  }, []);

  return {
    propertyModalVisible,
    propertyModalData,
    onSelect,
    closePropertyModal,
    openPropertyEditorForNodeKey,
    openModelEditorForNodeKey,
  };
}
