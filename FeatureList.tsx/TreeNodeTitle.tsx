import {
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import type { MouseEvent } from "react";
import { memo, useCallback, useMemo } from "react";

import type { TreeNode } from "./types";

export type TreeNodeTitleProps = {
  item: TreeNode;
  searchValue: string;
  onToggleVisibility: (key: string) => void;
  onEditModel?: (nodeKey: string) => void;
  onEditProperties?: (nodeKey: string) => void;
};

export const TreeNodeTitle = memo(
  ({
    item,
    searchValue,
    onToggleVisibility,
    onEditModel,
    onEditProperties,
  }: TreeNodeTitleProps) => {
    const isHidden = item.isVisible === false;
    const titleColor = isHidden ? "#bfbfbf" : "rgba(0, 0, 0, 0.85)";
    const searchMatchColor = isHidden ? "#8c8c8c" : "#f50";
    const actionIconColor = isHidden ? "#bfbfbf" : "#666";

    const highlightedTitle = useMemo(() => {
      if (!searchValue) {
        return <span style={{ color: titleColor }}>{item.title}</span>;
      }

      const index = item.title.toLowerCase().indexOf(searchValue.toLowerCase());
      if (index === -1) {
        return <span style={{ color: titleColor }}>{item.title}</span>;
      }

      const beforeStr = item.title.substring(0, index);
      const matchStr = item.title.substring(index, index + searchValue.length);
      const afterStr = item.title.substring(index + searchValue.length);

      return (
        <span style={{ color: titleColor }}>
          {beforeStr}
          <span style={{ color: searchMatchColor }}>{matchStr}</span>
          {afterStr}
        </span>
      );
    }, [item.title, searchValue, titleColor, searchMatchColor]);

    const handleVisibilityToggle = useCallback(
      (e: MouseEvent) => {
        e.stopPropagation();
        onToggleVisibility(item.key);
      },
      [item.key, onToggleVisibility]
    );

    const editMenuItems: MenuProps["items"] = useMemo(
      () => [
        { key: "model", label: "编辑模型" },
        { key: "properties", label: "编辑属性" },
      ],
      []
    );

    const onEditMenuClick = useCallback<
      NonNullable<MenuProps["onClick"]>
    >(
      (info) => {
        info.domEvent.stopPropagation();
        const k = String(info.key);
        if (k === "model") onEditModel?.(item.key);
        else if (k === "properties") onEditProperties?.(item.key);
      },
      [item.key, onEditModel, onEditProperties]
    );

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {highlightedTitle}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            marginLeft: "8px",
            gap: "4px",
          }}
        >
          <Dropdown
            menu={{ items: editMenuItems, onClick: onEditMenuClick }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
              style={{
                width: "20px",
                display: "flex",
                justifyContent: "center",
                color: actionIconColor,
                cursor: "pointer",
              }}
            >
              <EditOutlined />
            </span>
          </Dropdown>
          <div
            onClick={handleVisibilityToggle}
            style={{
              width: "20px",
              display: "flex",
              justifyContent: "center",
              marginLeft: "8px",
              color: actionIconColor,
            }}
          >
            {item.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </div>
        </div>
      </div>
    );
  }
);

TreeNodeTitle.displayName = "TreeNodeTitle";
