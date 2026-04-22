import { createRoot } from "react-dom/client";
import {
  MstButton,
  MstFeatureTree,
  MstTree,
  type FeatureTreeNode,
  type MstTreeNode,
} from "@mst/react";

const treeData: MstTreeNode[] = [
  {
    key: "root",
    label: "Model",
    children: [
      { key: "head", label: "Head" },
      {
        key: "body",
        label: "Body",
        children: [
          { key: "arm-l", label: "Left Arm" },
          { key: "arm-r", label: "Right Arm" },
        ],
      },
    ],
  },
];

const featureData: FeatureTreeNode[] = [
  {
    key: "0",
    title: "建筑A",
    id: 1001,
    children: [
      {
        key: "0-0",
        title: "一层",
        id: 1002,
        children: [
          { key: "0-0-0", title: "墙体-1", id: 1003 },
          { key: "0-0-1", title: "门-1", id: 1004 },
          { key: "0-0-2", title: "窗户-1", id: 1005 },
        ],
      },
      {
        key: "0-1",
        title: "二层",
        id: 1006,
        children: [
          { key: "0-1-0", title: "墙体-2", id: 1007 },
          { key: "0-1-1", title: "楼梯", id: 1008 },
        ],
      },
    ],
  },
  {
    key: "1",
    title: "建筑B",
    id: 2001,
    children: [
      { key: "1-0", title: "屋顶", id: 2002 },
      { key: "1-1", title: "地基", id: 2003 },
    ],
  },
];

function App() {
  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: 32,
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <h1>MST · React</h1>

      <section
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <h2>Button</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <MstButton onMstClick={() => console.log("default")}>
            Default
          </MstButton>
          <MstButton
            variant="primary"
            onMstClick={() => console.log("primary")}
          >
            Primary
          </MstButton>
          <MstButton variant="danger">Danger</MstButton>
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <h2>Simple tree</h2>
        <MstTree
          data={treeData}
          onMstSelect={(e) => console.log("select", (e as CustomEvent).detail)}
        />
      </section>

      <section style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <h2>Feature Tree</h2>
        <MstFeatureTree
          data={featureData}
          height={500}
          onMstSelect={(e) => console.log("select", (e as CustomEvent).detail)}
          onMstVisibilityChange={(e) =>
            console.log("visibility", (e as CustomEvent).detail)
          }
          onMstEditModel={(e) =>
            console.log("edit-model", (e as CustomEvent).detail)
          }
          onMstEditProperties={(e) =>
            console.log("edit-properties", (e as CustomEvent).detail)
          }
          onMstSearch={(e) => console.log("search", (e as CustomEvent).detail)}
        />
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
