import { useRef } from "react";
import { MstFeatureTree, type FeatureTreeEditDetail } from "@mst-ui/react";
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
    featureTreeRef,
    treeData,
    selectedKey,
    setSelectedKey,
    applySelectionVisibility,
    onMstVisibilityChange,
  } = useFeatureListTree(store.convertorStore.structureInfo);

  const {
    propertyModalVisible,
    propertyModalData,
    onMstSelect,
    closePropertyModal,
    openPropertyEditorForNodeKey,
    openModelEditorForNodeKey,
  } = useFeatureListSelection(
    store.convertorStore,
    treeData,
    findParquetDataByOid,
    setSelectedKey,
    featureTreeRef,
    applySelectionVisibility
  );

  openPropertyEditorRef.current = openPropertyEditorForNodeKey;
  openModelEditorRef.current = openModelEditorForNodeKey;

  const onMstEditModel = (e: Event) => {
    const { key } = (e as CustomEvent<FeatureTreeEditDetail>).detail;
    openModelEditorRef.current(key);
  };

  const onMstEditProperties = (e: Event) => {
    const { key } = (e as CustomEvent<FeatureTreeEditDetail>).detail;
    openPropertyEditorRef.current(key);
  };

  return (
    <Container>
      <div
        style={{
          height: "calc(100% - 0px)",
          maxHeight: "802px",
          overflow: "hidden",
          padding: "0 10px 12px",
        }}
      >
        <MstFeatureTree
          ref={featureTreeRef}
          data={treeData}
          selectedKey={selectedKey}
          fullWidth
          height={750}
          allowDeselect={false}
          onMstSelect={onMstSelect}
          onMstVisibilityChange={onMstVisibilityChange}
          onMstEditModel={onMstEditModel}
          onMstEditProperties={onMstEditProperties}
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
