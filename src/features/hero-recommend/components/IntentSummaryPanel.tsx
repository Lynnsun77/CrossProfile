import { useEffect, useMemo, useState } from 'react';
import mockTagsRaw from '../mock/mockTags.json';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import type { IntentParsedResult, MockTags } from '../types';

const mockTags = mockTagsRaw as MockTags;
const PREFERENCE_OPTIONS = ['优先可直接复用方案', '优先高匹配方案', '优先高收益方案'] as const;

function findGoalIdByTarget(target: string) {
  return mockTags.goals.find((item) => item.phrase === target)?.id ?? '';
}

function findSceneIdByLabel(scene: string) {
  return mockTags.scenes.find((item) => item.label === scene)?.id ?? '';
}

export function IntentSummaryPanel() {
  const parsed = useHeroRecommendStore((s) => s.intentParsed);
  const regenerateFromParsedEdit = useHeroRecommendStore((s) => s.regenerateFromParsedEdit);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<IntentParsedResult | null>(null);
  if (!parsed) return null;

  useEffect(() => {
    setDraft(parsed);
    setEditing(false);
  }, [parsed]);

  const fields: Array<{ key: 'target' | 'scene' | 'objectType' | 'preference'; label: string; value: string }> = useMemo(
    () => [
      { key: 'target', label: '目标', value: parsed.target },
      { key: 'scene', label: '场景', value: parsed.scene },
      { key: 'objectType', label: '推荐对象', value: parsed.objectType },
      { key: 'preference', label: '偏好', value: parsed.preference },
    ],
    [parsed],
  );

  const editDraft = draft ?? parsed;

  const handleRegenerate = () => {
    const nextParsed: IntentParsedResult = {
      ...editDraft,
      goalIds: findGoalIdByTarget(editDraft.target) ? [findGoalIdByTarget(editDraft.target)] : parsed.goalIds,
      sceneIds: findSceneIdByLabel(editDraft.scene) ? [findSceneIdByLabel(editDraft.scene)] : parsed.sceneIds,
    };
    regenerateFromParsedEdit(nextParsed);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-900">系统已理解你的需求</div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(parsed);
                setEditing(false);
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
            >
              重新生成
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:text-blue-700">
            编辑
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {fields.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-slate-400">{f.label}</span>
            {editing ? (
              f.key === 'preference' ? (
                <select
                  value={editDraft.preference}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...(current ?? parsed),
                      preference: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-300 focus:outline-none"
                >
                  {PREFERENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={editDraft[f.key]}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...(current ?? parsed),
                      [f.key]: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-300 focus:outline-none"
                />
              )
            ) : (
              <span className="truncate text-sm text-slate-800">{f.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
