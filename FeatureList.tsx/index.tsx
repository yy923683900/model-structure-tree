import { SearchOutlined } from "@ant-design/icons";
import { Input, Tree } from "antd";
import { useRef } from "react";
import { observer } from "mobx-react-lite";

import { FeaturePropertyModal } from "./FeaturePropertyModal";
import { useFeatureListParquet } from "./hooks/useFeatureListParquet";
import { useFeatureListSelection } from "./hooks/useFeatureListSelection";
import { useFeatureListTree } from "./hooks/useFeatureListTree";
import { Container } from "./style";
import { useRootStore } from "@/stores";

function FeatureList() {
  const store = useRootStore();
  const resultDir = store.convertorStore.detail?.sliceTask.resultDir;
  const { findParquetDataByOid } = useFeatureListParquet(resultDir);

  const openPropertyEditorRef = useRef<(nodeKey: string) => void>(() => {});
  const openModelEditorRef = useRef<(nodeKey: string) => void>(() => {});

  const {
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
  } = useFeatureListTree(store.convertorStore.structureInfo, {
    onEditProperties: (nodeKey) => openPropertyEditorRef.current(nodeKey),
    onEditModel: (nodeKey) => openModelEditorRef.current(nodeKey),
  });

  const {
    propertyModalVisible,
    propertyModalData,
    onSelect,
    closePropertyModal,
    openPropertyEditorForNodeKey,
    openModelEditorForNodeKey,
  } = useFeatureListSelection(
    store.convertorStore,
    treeData,
    findParquetDataByOid,
    setSelectedKeys,
    setExpandedKeys,
    setAutoExpandParent,
    scrollToTreeNode,
    applySelectionVisibility
  );

  openPropertyEditorRef.current = openPropertyEditorForNodeKey;
  openModelEditorRef.current = openModelEditorForNodeKey;

  return (
    <Container>
      <div style={{ padding: "12px 10px" }}>
        <Input
          placeholder="搜索"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={handleSearch}
          style={{ width: "100%" }}
        />
      </div>
      <div
        style={{
          height: "calc(100% - 52px)",
          maxHeight: "750px",
          overflow: "hidden",
          padding: "0 10px",
        }}
      >
        <Tree
          ref={treeRef}
          showLine
          blockNode
          itemHeight={40}
          height={750}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onExpand={onExpand}
          onSelect={onSelect}
          treeData={renderedTreeData}
        />
      </div>

      {propertyModalVisible && propertyModalData && (
        <FeaturePropertyModal
          selectedNodeData={propertyModalData}
          onClose={closePropertyModal}
        />
      )}
    </Container>
  );
}

export default observer(FeatureList);
