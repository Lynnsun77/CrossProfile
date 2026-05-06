import { useRecommendStore } from '../store/useRecommendStore';

const ACTION_LABEL: Record<string, string> = {
  product: '商品优化',
  marketing: '营销活动',
  acquisition: '人群拉新',
  content: '内容优化',
};

export function RecommendMatrix() {
  const recommends = useRecommendStore((s) => s.recommends);
  const featureBundle = useRecommendStore((s) => s.featureBundle);
  const requirement = useRecommendStore((s) => s.requirement);
  const view = useRecommendStore((s) => s.view);
  const setView = useRecommendStore((s) => s.setView);
  const starred = useRecommendStore((s) => s.starred);
  const toggleStar = useRecommendStore((s) => s.toggleStar);
  if (recommends.length === 0) return null;

  const crowdMap = new Map((requirement?.problems ?? []).map((item) => [item.id, `${item.segment} ${item.description}`]));

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold">🎯 推荐结果（共 {recommends.length} 条）</div>
        <div className="flex gap-1 rounded-md bg-gray-100 p-0.5 text-xs">
          {(['A', 'B'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`rounded px-3 py-1 ${view === option ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}
            >
              {option === 'A' ? '🎯 动作视角' : '🧮 特征视角'}
            </button>
          ))}
        </div>
      </div>

      {view === 'A' ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {recommends.map((card) => (
            <div key={card.id} className="group rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="text-xs text-gray-400">{crowdMap.get(card.problemId) ?? ACTION_LABEL[card.actionType] ?? card.actionType}</div>
                <button
                  type="button"
                  aria-label={starred.includes(card.id) ? `取消收藏 ${card.title}` : `收藏 ${card.title}`}
                  onClick={() => toggleStar(card.id)}
                  className={`text-lg ${starred.includes(card.id) ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                >
                  ★
                </button>
              </div>
              <div className="mb-1 text-sm font-medium">
                {card.confidence >= 0.8 ? '🟢' : '🟡'} {card.title}
              </div>
              <div className="mb-3 text-xs text-gray-600">{card.summary ?? card.detail}</div>
              <div className="mb-3 flex flex-wrap gap-1">
                {(card.referencedAssets ?? []).map((asset) => (
                  <span key={asset.id} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-600">
                    {asset.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-600">
                  {card.expectedKpi.metric} ↑ {Math.round(card.expectedKpi.lift * 100)}%
                </span>
                <span className="text-gray-400">置信度 {card.confidence.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex gap-1 opacity-100 transition xl:opacity-0 xl:group-hover:opacity-100">
                <ActionButton label="⚖️ 对比" />
                <ActionButton label="订阅" />
                <button type="button" className="flex-1 rounded bg-indigo-600 py-1 text-xs text-white">
                  试用
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3 text-sm">
          <Module title="人群模块" items={(featureBundle?.crowdSegments ?? []).map((item) => `◉ ${item.name}`)} />
          <Module
            title="关键特征"
            items={(featureBundle?.features ?? []).map((item) => `${item.dim}: ${item.value}${item.ratio ? ` ${Math.round(item.ratio * 100)}%` : ''}`)}
          />
          <Module title="可执行资产" items={(featureBundle?.executableAssets ?? []).map((item) => `🧩 ${item.name}`)} />
        </div>
      )}
    </div>
  );
}

const ActionButton = ({ label }: { label: string }) => (
  <button type="button" className="flex-1 rounded border py-1 text-xs hover:bg-gray-50">
    {label}
  </button>
);

const Module = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-lg border border-gray-200 p-3">
    <div className="mb-2 text-xs font-semibold text-gray-500">{title}</div>
    <ul className="space-y-1 text-[13px]">{items.map((item) => <li key={item}>{item}</li>)}</ul>
  </div>
);
