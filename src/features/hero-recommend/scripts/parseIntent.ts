import mockTagsRaw from '../mock/mockTags.json';
import mockTemplatesRaw from '../mock/mockTemplates.json';
import type {
  IntentParsedResult,
  MockTags,
  MockTemplates,
  ParseIntentInput,
} from '../types';

const mockTags = mockTagsRaw as MockTags;
const mockTemplates = mockTemplatesRaw as MockTemplates;

const GOAL_KEYWORDS: Array<{ id: string; keywords: string[] }> = [
  { id: 'orders', keywords: ['订单量', '订单'] },
  { id: 'gmv', keywords: ['GMV', 'gmv', '成交额'] },
  { id: 'acquire', keywords: ['拉新', '新客'] },
  { id: 'recall', keywords: ['召回', '唤醒', '流失'] },
  { id: 'retain', keywords: ['留存', '复购'] },
];

const SCENE_KEYWORDS: Array<{ id: string; keywords: string[] }> = [
  { id: 'local_weekly', keywords: ['生服周增', '周增'] },
  { id: 'local_cover', keywords: ['生服覆盖', '生服'] },
  { id: 'ecom_mkt', keywords: ['电商营销', '电商'] },
  { id: 'member_ops', keywords: ['会员运营', '会员'] },
  { id: 'category_exp', keywords: ['品类拓展', '品类'] },
];

const PREFERENCE_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: '高复用', label: '高复用' },
  { keyword: '可快速落地', label: '可快速落地' },
  { keyword: '快速落地', label: '可快速落地' },
  { keyword: '低成本', label: '低改造成本' },
  { keyword: '低改造', label: '低改造成本' },
];

const OBJECT_TYPE_MAP: Array<{ keyword: string; label: string }> = [
  { keyword: '人群', label: '人群' },
  { keyword: '标签', label: '标签' },
  { keyword: '策略', label: '策略' },
];

function detectGoalByText(text: string): string | null {
  for (const g of GOAL_KEYWORDS) {
    if (g.keywords.some((k) => text.includes(k))) return g.id;
  }
  return null;
}

function detectSceneByText(text: string): string | null {
  for (const s of SCENE_KEYWORDS) {
    if (s.keywords.some((k) => text.includes(k))) return s.id;
  }
  return null;
}

function detectPreferenceByText(text: string): string | null {
  for (const p of PREFERENCE_KEYWORDS) {
    if (text.includes(p.keyword)) return p.label;
  }
  return null;
}

function detectObjectTypeByText(text: string): string | null {
  for (const o of OBJECT_TYPE_MAP) {
    if (text.includes(o.keyword)) return o.label;
  }
  return null;
}

export function parseIntent(input: ParseIntentInput): IntentParsedResult {
  const text = (input.text ?? '').trim();
  const goalIds = input.goalIds ?? [];
  const sceneIds = input.sceneIds ?? [];

  const fallback = mockTemplates.intentFallback;

  let target: string;
  if (goalIds.length > 0) {
    const goal = mockTags.goals.find((g) => g.id === goalIds[0]);
    target = goal ? goal.phrase : fallback.target;
  } else {
    const gid = text ? detectGoalByText(text) : null;
    if (gid) {
      const goal = mockTags.goals.find((g) => g.id === gid);
      target = goal ? goal.phrase : fallback.target;
    } else {
      target = fallback.target;
    }
  }

  let scene: string;
  let resolvedSceneIds: string[] = sceneIds;
  if (sceneIds.length > 0) {
    const sc = mockTags.scenes.find((s) => s.id === sceneIds[0]);
    scene = sc ? sc.label : fallback.scene;
  } else {
    const sid = text ? detectSceneByText(text) : null;
    if (sid) {
      const sc = mockTags.scenes.find((s) => s.id === sid);
      scene = sc ? sc.label : fallback.scene;
      resolvedSceneIds = sid ? [sid] : [];
    } else {
      scene = fallback.scene;
    }
  }

  let resolvedGoalIds: string[] = goalIds;
  if (goalIds.length === 0 && text) {
    const gid = detectGoalByText(text);
    if (gid) resolvedGoalIds = [gid];
  }

  const objectType = text ? detectObjectTypeByText(text) ?? fallback.objectType : fallback.objectType;
  const preference = text ? detectPreferenceByText(text) ?? fallback.preference : fallback.preference;

  return {
    target,
    scene,
    objectType,
    preference,
    goalIds: resolvedGoalIds,
    sceneIds: resolvedSceneIds,
    rawText: text,
  };
}
