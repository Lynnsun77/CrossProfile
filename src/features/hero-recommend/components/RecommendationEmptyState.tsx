import mockTagsRaw from '../mock/mockTags.json';
import type { MockTags } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

const mockTags = mockTagsRaw as MockTags;

export function RecommendationEmptyState() {
  const applyExampleChip = useHeroRecommendStore((s) => s.applyExampleChip);

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="text-base font-medium text-slate-700 mb-2">暂未找到完全匹配的推荐…</div>
      <div className="text-sm text-slate-500 mb-4">换个条件试试，或点击下方示例需求。</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {mockTags.examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => applyExampleChip(ex)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-blue-200 hover:text-blue-600"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
