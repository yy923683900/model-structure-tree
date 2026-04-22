import { createRoot } from "react-dom/client";
import { MstButton, MstTree, type MstTreeNode } from "@mst/react";

const data: MstTreeNode[] = [
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

function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 32 }}>
      <h1>MST · React</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <MstButton onMstClick={() => console.log("default")}>Default</MstButton>
        <MstButton variant="primary" onMstClick={() => console.log("primary")}>
          Primary
        </MstButton>
        <MstButton variant="danger">Danger</MstButton>
      </div>
      <MstTree
        data={data}
        onMstSelect={(e) => console.log("select", (e as CustomEvent).detail)}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
