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
    <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 md:p-8 border border-blue-100 shadow-sm">
      <div className="mb-4 md:mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">描述你的需求，AI 帮你找到最佳方案</h2>
        <p className="mt-1 text-sm text-slate-600">
          点击标签或输入一句话，系统会自动理解目标、匹配场景并输出推荐。
        </p>
      </div>

      {/* 模式表达区 */}
      <div className="mb-5 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-medium">
          智能推荐
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-400 cursor-not-allowed px-3 py-1 text-xs font-medium">
          规则筛选（暂未开放）
        </span>
      </div>

      {/* 标签区 */}
      <div className="mb-4 space-y-3">
        <div>
          <div className="text-xs text-slate-500 mb-2">业务目标</div>
          <div className="flex flex-wrap gap-2">
            {mockTags.goals.map((g) => {
              const active = heroDraft.goalIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-2">业务场景</div>
          <div className="flex flex-wrap gap-2">
            {mockTags.scenes.map((s) => {
              const active = heroDraft.sceneIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleScene(s.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 输入框 */}
      <textarea
        rows={3}
        value={heroDraft.text}
        onChange={(e) => updateHeroText(e.target.value)}
        placeholder="如：我想在生服周增场景提升订单量"
        className="w-full rounded-xl border border-slate-200 focus:border-blue-400 focus:outline-none bg-white p-4 text-base resize-none"
      />

      {/* 示例 chips */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400">示例：</span>
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

      {/* 主按钮 */}
      <div className="mt-5">
        <button
          type="button"
          disabled={loading}
          onClick={() => submitHeroIntent()}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-base font-medium transition-colors ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '分析中...' : '生成推荐'}
        </button>
      </div>
    </div>
  );
}
