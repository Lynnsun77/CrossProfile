import mockTagsRaw from '../mock/mockTags.json';
import type { MockTags } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { HERO_INPUT_ID } from './heroInput';

const mockTags = mockTagsRaw as MockTags;

function SelectableChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      onClick={onClick}
      aria-checked={active}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active ? 'border-blue-300 bg-blue-100 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
      }`}
    >
      {label}
    </button>
  );
}

function TagSection({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string;
  items: MockTags['goals'] | MockTags['scenes'];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs text-slate-500">{title}</div>
      <div role="radiogroup" aria-label={title} className="flex flex-wrap gap-2">
        {items.map((item) => (
          <SelectableChip
            key={item.id}
            active={selectedIds.includes(item.id)}
            label={item.label}
            onClick={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function RecommendationHero() {
  const heroDraft = useHeroRecommendStore((s) => s.heroDraft);
  const analysisPhase = useHeroRecommendStore((s) => s.analysisPhase);
  const toggleGoal = useHeroRecommendStore((s) => s.toggleGoal);
  const toggleScene = useHeroRecommendStore((s) => s.toggleScene);
  const updateHeroText = useHeroRecommendStore((s) => s.updateHeroText);
  const applyExampleChip = useHeroRecommendStore((s) => s.applyExampleChip);
  const submitHeroIntent = useHeroRecommendStore((s) => s.submitHeroIntent);

  const loading = analysisPhase === 'analyzing';

  return (
    <div id="recommendation-home-hero" className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm md:p-8">
      <div className="mb-5 md:mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">描述你的需求或粘贴文档链接，我们帮你找到最佳方案</h2>
      </div>

      <div className="mb-4 space-y-3">
        <TagSection title="业务目标" items={mockTags.goals} selectedIds={heroDraft.goalIds} onToggle={toggleGoal} />
        <TagSection title="业务场景" items={mockTags.scenes} selectedIds={heroDraft.sceneIds} onToggle={toggleScene} />
      </div>

      <label htmlFor={HERO_INPUT_ID} className="sr-only">
        需求输入
      </label>
      <textarea
        id={HERO_INPUT_ID}
        aria-label="需求输入"
        rows={3}
        value={heroDraft.text}
        onChange={(event) => updateHeroText(event.target.value)}
        placeholder="试试这样问我：我想在生服用增场景提升订单量"
        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-base focus:border-blue-400 focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">示例：</span>
        {mockTags.examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => applyExampleChip(example)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-blue-200 hover:text-blue-600"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <button
          type="button"
          disabled={loading}
          onClick={() => submitHeroIntent()}
          className={`rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 ${
            loading ? 'cursor-not-allowed opacity-70' : ''
          }`}
        >
          {loading ? '分析中...' : '生成推荐'}
        </button>
      </div>
    </div>
  );
}
