import { useEffect, useState } from 'react';
import { getAssetPreview, type AssetPreview } from '../api/assetPreview';
import { useAssetPreviewCacheStore } from '../store/assetPreviewCacheStore';

type UseAssetPreviewState = {
  data: AssetPreview | null;
  loading: boolean;
  error: string | null;
};

const TTL_MS = 60 * 1000;
const inFlight = new Map<string, Promise<AssetPreview>>();

export function useAssetPreview(assetId: string, enabled: boolean): UseAssetPreviewState {
  const getFresh = useAssetPreviewCacheStore((s) => s.getFresh);
  const setCached = useAssetPreviewCacheStore((s) => s.setCached);

  const [state, setState] = useState<UseAssetPreviewState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!assetId) return;

    const cached = getFresh(assetId, TTL_MS);
    if (cached) {
      setState({ data: cached, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    const p = inFlight.get(assetId) ?? getAssetPreview(assetId);
    inFlight.set(assetId, p);

    p.then(
      (data) => {
        inFlight.delete(assetId);
        setCached(assetId, data);
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      },
      (err: unknown) => {
        inFlight.delete(assetId);
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'preview_failed',
        });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [assetId, enabled, getFresh, setCached]);

  return state;
}

