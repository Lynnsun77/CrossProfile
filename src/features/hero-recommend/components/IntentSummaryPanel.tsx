import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

export function IntentSummaryPanel() {
  const parsed = useHeroRecommendStore((s) => s.intentParsed);
  if (!parsed) return null;

  const fields: Array<{ label: string; value: string }> = [
    { label: '目标', value: parsed.target },
    { label: '场景', value: parsed.scene },
    { label: '推荐对象', value: parsed.objectType },
    { label: '偏好', value: parsed.preference },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-medium text-slate-900">系统已理解你的需求</div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">{f.label}</span>
            <span className="text-sm text-slate-800">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
