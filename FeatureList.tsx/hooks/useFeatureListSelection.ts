import { message } from "antd";
import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  postCancelFeatureTransformEditToIframe,
  postClearHighlightToFeatureIframe,
  postHighlightToFeatureIframe,
  postStartFeatureTransformEditToIframe,
} from "../featureIframe";
import { findKeyByOid, findNodeDataByKey } from "../treeUtils";
import type { TreeNode } from "../types";
import type { MstFeatureTreeElement } from "./useFeatureListTree";

import type { ConvertorStore } from "@/stores/convertor";

type FindParquet = (nodeId: string | number) => any | null;

function cloneRow(row: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

export function useFeatureListSelection(
  convertorStore: ConvertorStore,
  treeData: TreeNode[],
  findParquetDataByOid: FindParquet,
  setSelectedKey: (k: string | null) => void,
  featureTreeRef: RefObject<MstFeatureTreeElement | null>,
  applySelectionVisibility: (nodeKey: string | null) => void
) {
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [propertyModalData, setPropertyModalData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const mapLoc = convertorStore.mapLocationEnabled;

  const runSelection = useCallback(
    (key: string | null) => {
      setPropertyModalVisible(false);
      setPropertyModalData(null);
      postCancelFeatureTransformEditToIframe(mapLoc);
      setSelectedKey(key);
      if (key) {
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
        setTimeout(() => postClearHighlightToFeatureIframe(mapLoc), 100);
      }
    },
    [applySelectionVisibility, convertorStore, mapLoc, setSelectedKey, treeData]
  );

  const onMstSelect = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<{ key: string | null }>).detail;
      const key = detail.key;
      runSelection(key);
    },
    [runSelection]
  );

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
      setSelectedKey(nodeKey);
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
      setSelectedKey,
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
      setSelectedKey(nodeKey);
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
    [applySelectionVisibility, convertorStore, mapLoc, setSelectedKey, treeData]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "featureClicked") return;

      const { oid } = event.data;
      if (oid === null || oid === undefined) {
        setSelectedKey(null);
        featureTreeRef.current?.selectByKey(null, {
          emit: false,
          isolate: false,
        });
        setPropertyModalVisible(false);
        setPropertyModalData(null);
        convertorStore.clearSelectedFeature();
        postCancelFeatureTransformEditToIframe(mapLoc);
        return;
      }

      const targetKey = findKeyByOid(oid, treeData);
      if (!targetKey) return;

      setSelectedKey(targetKey);

      const nodeData = findNodeDataByKey(targetKey, treeData);
      if (nodeData?.id !== undefined) {
        convertorStore.setSelectedFeature(nodeData.id, null);
      }

      featureTreeRef.current?.selectByOid(oid, {
        emit: false,
        isolate: false,
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    convertorStore,
    featureTreeRef,
    mapLoc,
    setSelectedKey,
    treeData,
  ]);

  const closePropertyModal = useCallback(() => {
    setPropertyModalVisible(false);
    setPropertyModalData(null);
  }, []);

  return {
    propertyModalVisible,
    propertyModalData,
    onMstSelect,
    closePropertyModal,
    openPropertyEditorForNodeKey,
    openModelEditorForNodeKey,
  };
}
