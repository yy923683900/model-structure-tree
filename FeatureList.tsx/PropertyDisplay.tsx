import { Input } from "antd";

const { TextArea } = Input;
import { memo, useCallback } from "react";

const OID_KEYS = new Set(["_oid", "oid"]);

function isOidField(key: string) {
  return OID_KEYS.has(key);
}

function isReadonlyPropertyKey(key: string) {
  return isOidField(key) || key.startsWith("_");
}

function formatReadonlyValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "无";
  if (key === "bbox" && Array.isArray(value)) {
    return `[${value.map((v) => Number(v).toFixed(6)).join(", ")}]`;
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(6).replace(/\.?0+$/, "");
  }
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function valueToInputString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseInputToValue(raw: string, prev: unknown): unknown {
  const t = raw.trim();
  if (t === "" && (prev === null || prev === undefined)) return prev;
  if (typeof prev === "number") {
    const n = Number(t);
    return Number.isFinite(n) ? n : prev;
  }
  if (typeof prev === "boolean") {
    if (t === "true" || t === "1") return true;
    if (t === "false" || t === "0") return false;
    return prev;
  }
  if (prev !== null && typeof prev === "object") {
    try {
      return JSON.parse(t);
    } catch {
      return prev;
    }
  }
  return t;
}

type Props = {
  draft: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
  isDragging: boolean;
  /** 为 false 时仅展示，不可改（仍受 isReadonlyPropertyKey 约束的字段始终只读） */
  editable: boolean;
};

export const PropertyDisplay = memo(
  ({ draft, onFieldChange, isDragging, editable }: Props) => {
    const handleInputChange = useCallback(
      (key: string, raw: string, prev: unknown) => {
        onFieldChange(key, parseInputToValue(raw, prev));
      },
      [onFieldChange]
    );

    if (isDragging) {
      return (
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflow: "hidden",
            fontSize: "13px",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}
        >
          拖拽中...
        </div>
      );
    }

    const entries = Object.entries(draft).filter(([, v]) => v !== null);

    const readonlyBlockStyle = {
      color: "#333",
      wordBreak: "break-word" as const,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: "13px",
    };

    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "16px",
          overflow: "auto",
          fontSize: "13px",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ lineHeight: "1.6" }}>
          {entries.map(([key, value]) => (
            <div
              key={key}
              style={{
                marginBottom: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontWeight: "500",
                  color: "#666",
                  fontSize: "13px",
                  minWidth: "80px",
                  flexShrink: 0,
                }}
              >
                {key === "title" ? "Name" : key}:
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isReadonlyPropertyKey(key) || !editable ? (
                  <div style={readonlyBlockStyle}>
                    {formatReadonlyValue(key, value)}
                  </div>
                ) : typeof value === "object" && value !== null ? (
                  <TextArea
                    value={valueToInputString(value)}
                    onChange={(e) =>
                      handleInputChange(key, e.target.value, value)
                    }
                    rows={4}
                    size="small"
                    style={{
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: "13px",
                    }}
                  />
                ) : (
                  <Input
                    value={valueToInputString(value)}
                    onChange={(e) =>
                      handleInputChange(key, e.target.value, value)
                    }
                    size="small"
                    style={{
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: "13px",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#999",
              padding: "20px",
            }}
          >
            暂无属性信息
          </div>
        )}
      </div>
    );
  }
);

PropertyDisplay.displayName = "PropertyDisplay";
