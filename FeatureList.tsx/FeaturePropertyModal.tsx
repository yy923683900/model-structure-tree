import { CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Rnd } from "react-rnd";

import { PropertyDisplay } from "./PropertyDisplay";

type Props = {
  selectedNodeData: Record<string, unknown> & { title?: string };
  onClose: () => void;
};

function cloneForEdit(row: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

export function FeaturePropertyModal({ selectedNodeData, onClose }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    cloneForEdit(selectedNodeData)
  );

  useEffect(() => {
    setDraft(cloneForEdit(selectedNodeData));
    setIsEditing(false);
  }, [selectedNodeData]);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragStop = useCallback(() => setIsDragging(false), []);
  const handleResizeStart = useCallback(() => setIsResizing(true), []);
  const handleResizeStop = useCallback(() => setIsResizing(false), []);

  const handleStartEdit = useCallback(() => setIsEditing(true), []);

  const handleConfirmEdit = useCallback(() => setIsEditing(false), []);

  const handleCancelEdit = useCallback(() => {
    setDraft(cloneForEdit(selectedNodeData));
    setIsEditing(false);
  }, [selectedNodeData]);

  const modalConfig = useMemo(
    () => ({
      default: {
        x: 500,
        y: 0,
        width: 400,
        height: 500,
      },
      minWidth: 280,
      minHeight: 180,
      maxWidth: Math.min(800, window.innerWidth - 100),
      maxHeight: Math.min(600, window.innerHeight - 100),
    }),
    []
  );

  const modalStyle = useMemo(
    (): CSSProperties => ({
      zIndex: 9999,
      border: "1px solid #d9d9d9",
      borderRadius: "8px",
      backgroundColor: "#fff",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transform: isDragging || isResizing ? "translateZ(0)" : "none",
      willChange: isDragging || isResizing ? "transform" : "auto",
      position: "fixed",
    }),
    [isDragging, isResizing]
  );

  const title =
    typeof selectedNodeData.title === "string"
      ? selectedNodeData.title
      : typeof draft?.title === "string"
        ? draft.title
        : "属性";

  return (
    <Rnd
      {...modalConfig}
      bounds="window"
      dragHandleClassName="modal-header"
      style={modalStyle}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      scale={1}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f0f0f0",
            backgroundColor: "#fafafa",
            borderRadius: "8px 8px 0 0",
            cursor: "move",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              fontSize: "14px",
              color: "#262626",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginRight: "12px",
            }}
          >
            {title}
          </div>
          <CloseOutlined
            onClick={onClose}
            style={{
              cursor: "pointer",
              color: "#8c8c8c",
              padding: "4px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          />
        </div>

        <PropertyDisplay
          draft={draft}
          onFieldChange={handleFieldChange}
          isDragging={isDragging || isResizing}
          editable={isEditing}
        />

        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid #f0f0f0",
            padding: "10px 16px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#fff",
            borderRadius: "0 0 8px 8px",
          }}
        >
          {!isEditing ? (
            <Button type="primary" onClick={handleStartEdit}>
              编辑
            </Button>
          ) : (
            <>
              <Button onClick={handleCancelEdit}>取消</Button>
              <Button type="primary" onClick={handleConfirmEdit}>
                确定
              </Button>
            </>
          )}
        </div>
      </div>
    </Rnd>
  );
}
