import type { DataNode } from "antd/es/tree";

export interface TreeNode extends DataNode {
  title: string;
  key: string;
  isVisible?: boolean;
  children?: TreeNode[];
  bbox?: number[];
  id?: string | number;
}
