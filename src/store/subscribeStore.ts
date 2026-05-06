import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { postSubscribe, type SubscribeTarget } from '../api/subscribe';
import { postSubscribeBatch } from '../api/subscribeBatch';

export const DEFAULT_SUBSCRIBE_TARGETS: SubscribeTarget[] = [
  { key: 'ldmp', label: 'LDMP' },
  { key: 'ecommerce_dmp', label: '电商 DMP' },
  { key: 'policy_platform', label: '策略平台' },
  { key: 'algo_feature_platform', label: '算法特征平台' },
];

type SubscribeState = {
  // Remember the last chosen targets to support "default last targets".
  lastTargets: string[];
  // assetId -> targets
  subscribed: Record<string, string[]>;
  pendingAssetIds: string[];

  isSubscribed: (assetId: string) => boolean;
  getSubscribedTargets: (assetId: string) => string[];
  isPending: (assetId: string) => boolean;

  setLastTargets: (targets: string[]) => void;
  subscribe: (assetId: string, targets: string[]) => Promise<void>;
  subscribeBatch: (assetIds: string[], targets: string[]) => Promise<void>;
};

function uniq(next: string[]) {
  return Array.from(new Set(next)).filter(Boolean);
}

export const useSubscribeStore = create<SubscribeState>()(
  persist(
    (set, get) => ({
      lastTargets: DEFAULT_SUBSCRIBE_TARGETS.slice(0, 2).map((t) => t.key),
      subscribed: {},
      pendingAssetIds: [],

      isSubscribed: (assetId) => {
        const t = get().subscribed[assetId];
        return Array.isArray(t) && t.length > 0;
      },
      getSubscribedTargets: (assetId) => get().subscribed[assetId] ?? [],
      isPending: (assetId) => get().pendingAssetIds.includes(assetId),

      setLastTargets: (targets) => set({ lastTargets: uniq(targets) }),
      subscribe: async (assetId, targets) => {
        const nextTargets = uniq(targets);
        if (nextTargets.length === 0) return;

        set((s) => ({ pendingAssetIds: uniq([...s.pendingAssetIds, assetId]) }));
        try {
          const resp = await postSubscribe({ assetId, targets: nextTargets });
          if (resp.success) {
            set((s) => ({
              subscribed: { ...s.subscribed, [assetId]: resp.targets },
              lastTargets: resp.targets,
            }));
          }
        } finally {
          set((s) => ({ pendingAssetIds: s.pendingAssetIds.filter((id) => id !== assetId) }));
        }
      },

      subscribeBatch: async (assetIds, targets) => {
        const nextAssetIds = uniq(assetIds);
        const nextTargets = uniq(targets);
        if (nextAssetIds.length === 0 || nextTargets.length === 0) return;

        set((s) => ({ pendingAssetIds: uniq([...s.pendingAssetIds, ...nextAssetIds]) }));
        try {
          const resp = await postSubscribeBatch({ assetIds: nextAssetIds, targets: nextTargets });
          if (resp.success) {
            set((s) => {
              const nextSubscribed = { ...s.subscribed };
              for (const r of resp.results) {
                if (r.success) nextSubscribed[r.assetId] = r.targets;
              }
              return { subscribed: nextSubscribed, lastTargets: nextTargets };
            });
          }
        } finally {
          set((s) => ({ pendingAssetIds: s.pendingAssetIds.filter((id) => !nextAssetIds.includes(id)) }));
        }
      },
    }),
    {
      name: 'cp_subscribe_v1',
      partialize: (s) => ({ lastTargets: s.lastTargets, subscribed: s.subscribed }),
    }
  )
);
