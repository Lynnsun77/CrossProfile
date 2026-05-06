import { mockActionConfigs, mockAssets, mockDispatchTasks, mockFeatures } from '../mock';
import { searchFactorySimilarFeatures } from '../mock/factory';

export type SearchType = 'asset' | 'scene' | 'rule' | 'task' | 'user';

export type SearchRequest = {
  q: string;
  types: SearchType[];
};

export type SearchResultItem = {
  id: string;
  type: SearchType;
  title: string;
  subtitle?: string;
  // Keep shape close to "click -> navigate" behavior without introducing routing infra.
  to: string;
};

export type SearchResponse = {
  items: SearchResultItem[];
};

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function includesAnyField(q: string, fields: Array<string | undefined | null>) {
  const nq = normalize(q);
  if (!nq) return false;
  return fields.some((field) => normalize(String(field ?? '')).includes(nq));
}

export function buildSearchUrl(req: SearchRequest) {
  const params = new URLSearchParams();
  params.set('q', req.q);
  if (req.types.length) params.set('types', req.types.join(','));
  return `/api/search?${params.toString()}`;
}

// In-memory mock implementation while keeping a stable API signature.
export async function searchApi(req: SearchRequest): Promise<SearchResponse> {
  void buildSearchUrl(req); // ensure the URL shape stays in sync with the spec

  const q = req.q.trim();
  const types = new Set(req.types);
  if (q.length < 2) return { items: [] };

  const items: SearchResultItem[] = [];

  if (types.has('asset')) {
    for (const asset of mockAssets) {
      if (
        includesAnyField(q, [
          asset.id,
          asset.name,
          asset.nameBiz,
          asset.nameAlgo,
          asset.desc,
          asset.description,
          asset.namespace,
          asset.domain,
          asset.type,
        ])
      ) {
        items.push({
          id: asset.id,
          type: 'asset',
          title: asset.nameBiz || asset.nameAlgo || asset.name,
          subtitle: `${asset.type} · ${asset.domain} · ${asset.namespace}`,
          to: `/marketplace/${asset.id}`,
        });
      }
    }
  }

  if (types.has('scene')) {
    for (const cfg of mockActionConfigs) {
      // MarketAction uses route param as crowd_id (asset id) in this demo.
      if (
        includesAnyField(q, [
          cfg.id,
          cfg.crowd_id,
          cfg.channel,
          cfg.copywriting_choice,
          ...(cfg.touchpoints ?? []),
          ...(cfg.channels ?? []),
        ])
      ) {
        items.push({
          id: cfg.id ?? cfg.crowd_id,
          type: 'scene',
          title: `运营场景 · ${cfg.copywriting_choice}`,
          subtitle: `crowd=${cfg.crowd_id} · channel=${cfg.channel}`,
          to: `/marketplace/action/${cfg.crowd_id}`,
        });
      }
    }
  }

  if (types.has('rule')) {
    for (const feat of mockFeatures) {
      if (feat.type !== 'rule') continue;
      if (includesAnyField(q, [feat.id, feat.name, feat.namespace, feat.type, feat.description])) {
        items.push({
          id: feat.id,
          type: 'rule',
          title: feat.name,
          subtitle: `${feat.type} · ${feat.namespace}`,
          to: `/factory/feature/${feat.id}`,
        });
      }
    }

    for (const item of searchFactorySimilarFeatures(q)) {
      items.push({
        id: `factory_similarity_${item.featureId}`,
        type: 'rule',
        title: `${item.featureName} · 复用候选`,
        subtitle: `相似度 ${item.similarityScore}% · ${item.reuseSuggestion}`,
        to: `/factory/similarity-search?view=producer`,
      });
    }
  }

  if (types.has('task')) {
    for (const task of mockDispatchTasks) {
      if (includesAnyField(q, [task.id, task.title, task.status, task.created_at, task.crowdId, task.actionId])) {
        items.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: `${task.status} · ${task.created_at}`,
          to: `/marketplace/workbench`,
        });
      }
    }
  }

  if (types.has('user')) {
    // Minimal mock - keep it in-memory and deterministic.
    const users: Array<{ id: string; name: string; team: string }> = [
      { id: 'u_001', name: '张三', team: 'Cross-Profile Demo' },
      { id: 'u_002', name: '李四', team: 'Marketplace' },
      { id: 'u_003', name: '王五', team: 'Foundry' },
    ];

    for (const u of users) {
      if (includesAnyField(q, [u.id, u.name, u.team])) {
        items.push({
          id: u.id,
          type: 'user',
          title: u.name,
          subtitle: u.team,
          to: `/my`,
        });
      }
    }
  }

  // Keep UX snappy: deterministic order and hard cap.
  const typeOrder: Record<SearchType, number> = {
    asset: 1,
    scene: 2,
    rule: 3,
    task: 4,
    user: 5,
  };

  const sorted = items
    .slice()
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.title.localeCompare(b.title));

  // Simulate network latency without introducing infra.
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return { items: sorted.slice(0, 30) };
}
