import { useRecommendStore } from '../hooks/useRecommendStore';

export function ThinkingTrace() {
  const trace = useRecommendStore((s) => s.thinkingTrace);
  return (
    <div className="space-y-2">
      {trace.map((t) => (
        <div key={t.id} className="flex items-start gap-2 text-sm">
          <span>{t.status === 'done' ? '✅' : t.status === 'running' ? '⏳' : '•'}</span>
          <div className="min-w-0">
            <div className="font-medium">{t.title ?? t.label ?? t.id}</div>
            {(t.detail ?? t.description) && <div className="text-gray-500 text-xs">{t.detail ?? t.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RequirementCardView() {
  const req = useRecommendStore((s) => s.requirement);
  if (!req) return <div className="text-gray-400 text-sm">等待解析结果…</div>;

  const audience =
    // compatible with both shapes
    ((req as any).audience as string[] | undefined) ??
    req.problems?.map((p) => `${p.segment}·${p.description}`) ??
    [];
  const goal = ((req as any).goal as string | undefined) ?? '';
  const constraints = ((req as any).constraints as string[] | undefined) ?? [];

  return (
    <div className="space-y-1 text-sm">
      <div>
        <b>行业:</b> {req.industry}
      </div>
      {goal ? (
        <div>
          <b>目标:</b> {goal}
        </div>
      ) : null}
      {audience.length ? (
        <div>
          <b>人群:</b> {audience.join('、')}
        </div>
      ) : null}
      {constraints.length ? (
        <div>
          <b>约束:</b> {constraints.join('、')}
        </div>
      ) : null}
      <div className="text-xs text-gray-500">置信度 {(req.confidence * 100).toFixed(0)}%</div>
    </div>
  );
}

export function ActionMatrix() {
  const actions = useRecommendStore((s) => s.actions);
  if (!actions.length) return null;

  return (
    <div className="border rounded-lg p-3">
      <div className="font-semibold mb-2">Step2 · 行为建议</div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const anyA = a as any;
          const priority = anyA.priority ?? (a.confidence >= 0.8 ? 'P0' : a.confidence >= 0.6 ? 'P1' : 'P2');
          const kpi = anyA.kpi ?? `${a.expectedKpi.metric} ↑ ${(a.expectedKpi.lift * 100).toFixed(0)}%`;
          const desc = anyA.desc ?? a.detail;
          const stage = anyA.stage ?? a.actionType;
          return (
            <div key={a.id} className="border rounded p-2 text-sm">
              <div className="flex justify-between">
                <span className="text-xs text-blue-600">{stage}</span>
                <span className="text-xs px-1 bg-gray-100 rounded">{priority}</span>
              </div>
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-gray-500">{desc}</div>
              <div className="text-xs text-green-600 mt-1">KPI · {kpi}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureBundleView() {
  const bundle = useRecommendStore((s) => s.featureBundle);
  if (!bundle) return null;

  const anyB = bundle as any;
  const featurePack = anyB.featurePack;
  const model = anyB.model;

  if (featurePack && model) {
    return (
      <div className="border rounded-lg p-3">
        <div className="font-semibold mb-2">Step2 · 特征 / 模型包</div>
        <div className="text-sm">
          <div>
            📦 <b>{featurePack.name}</b>
          </div>
          <div className="text-xs text-gray-500 ml-5">{(featurePack.features ?? []).join(' · ')}</div>
          <div className="mt-2">
            🤖 <b>{model.name}</b>({model.type})
          </div>
          <div className="text-xs text-gray-500 ml-5">
            种子 {Number(model.seedSize ?? 0).toLocaleString()} · 预估触达 {Number(model.expectedReach ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3">
      <div className="font-semibold mb-2">Step2 · 特征拼装</div>
      <div className="text-sm text-gray-700">
        <div className="mb-2">人群段：{bundle.crowdSegments.map((c) => c.name).join(' · ')}</div>
        <div className="mb-2">关键特征：{bundle.features.map((f) => `${f.dim}:${f.value}`).join(' · ')}</div>
        <div>可执行资产：{bundle.executableAssets.map((x) => x.name).join(' · ')}</div>
      </div>
    </div>
  );
}

export function GapBar() {
  const gaps = useRecommendStore((s) => s.gaps);
  if (!gaps.length) return null;

  return (
    <div className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded">
      <div className="font-semibold mb-1 text-sm">Step3 · 缺口提示({gaps.length})</div>
      {gaps.map((g) => (
        <div key={g.id} className="text-sm">
          <span className="text-xs px-1 mr-1 bg-amber-200 rounded">{g.severity}</span>
          <b>{g.title}</b> — <span className="text-gray-600">{g.suggestedOwner}</span>
        </div>
      ))}
    </div>
  );
}

export function SummaryDock() {
  const step = useRecommendStore((s) => s.step);
  const actions = useRecommendStore((s) => s.actions);
  const gaps = useRecommendStore((s) => s.gaps);
  const bundle = useRecommendStore((s) => s.featureBundle);
  const reset = useRecommendStore((s) => s.reset);
  if (step !== 'result') return null;

  const assets = bundle ? bundle.executableAssets.length : 0;
  return (
    <div className="border-2 border-green-500 bg-green-50 rounded-lg p-3 flex justify-between items-center">
      <div>
        <div className="font-semibold">Step4 · 收口</div>
        <div className="text-sm text-gray-600">✅ 资产 {assets} · 建议 {actions.length} · 缺口 {gaps.length}</div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" type="button">
          一键配置投放
        </button>
        <button className="px-3 py-1 border rounded text-sm" type="button" onClick={reset}>
          再来一次
        </button>
      </div>
    </div>
  );
}
