import mockTagsRaw from '../mock/mockTags.json';
import type { MockTags } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

const mockTags = mockTagsRaw as MockTags;

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
      <div className="mb-4 md:mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">描述你的需求，AI 帮你找到最佳方案</h2>
        <p className="mt-1 text-sm text-slate-600">点击标签或输入一句话，系统会自动理解目标、匹配场景并输出推荐。</p>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">智能推荐</span>
        <span className="inline-flex cursor-not-allowed items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400">
          规则筛选（暂未开放）
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <div className="mb-2 text-xs text-slate-500">业务目标</div>
          <div className="flex flex-wrap gap-2">
            {mockTags.goals.map((goal) => {
              const active = heroDraft.goalIds.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'border-blue-300 bg-blue-100 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                  }`}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs text-slate-500">业务场景</div>
          <div className="flex flex-wrap gap-2">
            {mockTags.scenes.map((scene) => {
              const active = heroDraft.sceneIds.includes(scene.id);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => toggleScene(scene.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'border-blue-300 bg-blue-100 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                  }`}
                >
                  {scene.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <textarea
        id="recommendation-hero-input"
        rows={3}
        value={heroDraft.text}
        onChange={(event) => updateHeroText(event.target.value)}
        placeholder="如：我想在生服用增场景提升订单量"
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
