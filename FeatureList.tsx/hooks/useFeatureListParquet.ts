import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { useCallback, useEffect, useState } from "react";

export function useFeatureListParquet(resultDir: string | undefined) {
  const [parquetData, setParquetData] = useState<any[]>([]);

  useEffect(() => {
    if (!resultDir) {
      setParquetData([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `https://convertor-preview.maptalks.com/${resultDir}/f/properties.parquet`;
        const file = await asyncBufferFromUrl({ url });
        const data = await parquetReadObjects({ file });
        if (!cancelled) setParquetData(data);
      } catch (error) {
        console.error("获取Parquet数据失败:", error);
        if (!cancelled) setParquetData([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resultDir]);

  const findParquetDataByOid = useCallback(
    (nodeId: string | number): any | null => {
      try {
        if (!parquetData.length) return null;
        const matched = parquetData.find(
          (item) =>
            item._oid === nodeId ||
            item._oid === String(nodeId) ||
            String(item._oid) === String(nodeId)
        );
        return matched ?? null;
      } catch (e) {
        console.error("查找Parquet数据时出错:", e);
        return null;
      }
    },
    [parquetData]
  );

  return { findParquetDataByOid };
}
