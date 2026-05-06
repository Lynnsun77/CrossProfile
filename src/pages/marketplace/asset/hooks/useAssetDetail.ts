import { useEffect, useState } from 'react';
import { getAssetDetailMockData } from '../services/mock';
import type { AssetDetailMockData, AssetDetailQueryState } from '../types';

export function useAssetDetail(assetId: string | undefined, query: AssetDetailQueryState) {
  const [data, setData] = useState<AssetDetailMockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTimedOut(false);
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setTimedOut(true);
      }
    }, 3000);

    getAssetDetailMockData(assetId, query)
      .then((next) => {
        if (!cancelled) {
          setData(next);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : '加载诊断详情失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [assetId, query.compareWith, query.scope, query.source, query.useCase, query.view, reloadSeed]);

  return {
    data,
    loading,
    error,
    timedOut,
    retry: () => setReloadSeed((seed) => seed + 1),
  };
}
