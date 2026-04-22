export function getFeatureIframe(mapLocationEnabled: boolean): HTMLIFrameElement | null {
  const featureFile = mapLocationEnabled ? "feature2.html" : "feature4.html";
  const iframes = document.querySelectorAll("iframe");
  for (let i = 0; i < iframes.length; i++) {
    if (iframes[i].src.includes(featureFile)) return iframes[i];
  }
  return null;
}

function serializeHighlightMessage(oid: unknown, bbox: number[] | null) {
  const message = { type: "highlightFeature" as const, oid, bbox };
  return JSON.parse(JSON.stringify(message)) as typeof message;
}

export function postHighlightToFeatureIframe(
  mapLocationEnabled: boolean,
  oid: string | number,
  bboxSource: number[] | undefined
) {
  const featureIframe = getFeatureIframe(mapLocationEnabled);
  if (!featureIframe?.contentWindow) {
    console.warn("未找到 feature.html iframe");
    return;
  }

  let bboxData: number[] | null = null;
  if (bboxSource && Array.isArray(bboxSource) && bboxSource.length >= 6) {
    const validBbox = bboxSource.slice(0, 6)
      .map((item) => {
        const num = Number(item);
        return Number.isFinite(num) ? num : null;
      });
    if (validBbox.every((item) => item !== null)) {
      bboxData = validBbox as number[];
    }
  }

  try {
    const parsed = serializeHighlightMessage(oid, bboxData);
    featureIframe.contentWindow.postMessage(parsed, "*");
  } catch (e) {
    console.error("序列化或发送数据时出错:", e);
    try {
      featureIframe.contentWindow.postMessage(
        { type: "highlightFeature", oid, bbox: null },
        "*"
      );
    } catch (e2) {
      console.error("发送降级消息也失败:", e2);
    }
  }
}

export function postClearHighlightToFeatureIframe(mapLocationEnabled: boolean) {
  const featureIframe = getFeatureIframe(mapLocationEnabled);
  if (!featureIframe?.contentWindow) return;
  try {
    const parsed = serializeHighlightMessage(null, null);
    featureIframe.contentWindow.postMessage(parsed, "*");
  } catch (e) {
    console.error("发送清除高亮消息时出错:", e);
  }
}

/**
 * 通知 feature iframe：开启指定构件 oid 的 TRS 变换编辑。
 * iframe 侧会加载该构件的精模并挂载 TransformControls。
 */
export function postStartFeatureTransformEditToIframe(
  mapLocationEnabled: boolean,
  oid: string | number
) {
  const featureIframe = getFeatureIframe(mapLocationEnabled);
  if (!featureIframe?.contentWindow) {
    console.warn("未找到 feature.html iframe，无法开启构件变换编辑");
    return;
  }
  try {
    featureIframe.contentWindow.postMessage(
      { type: "startFeatureTransformEdit", oid },
      "*"
    );
  } catch (e) {
    console.error("发送开启构件变换编辑消息时出错:", e);
  }
}

/** 通知 feature iframe：取消当前构件 TRS 变换编辑 */
export function postCancelFeatureTransformEditToIframe(
  mapLocationEnabled: boolean
) {
  const featureIframe = getFeatureIframe(mapLocationEnabled);
  if (!featureIframe?.contentWindow) return;
  try {
    featureIframe.contentWindow.postMessage(
      { type: "cancelFeatureTransformEdit" },
      "*"
    );
  } catch (e) {
    console.error("发送取消构件变换编辑消息时出错:", e);
  }
}
