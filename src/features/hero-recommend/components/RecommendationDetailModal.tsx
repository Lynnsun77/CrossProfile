import { useEffect, useMemo, useRef } from 'react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

const DETAIL_SOURCE_COPY = {
  hero: {
    rootLabel: '智能推荐',
    reasonTitle: '为什么推荐你',
    summaryText: 'AI 判断你当前的核心诉求与该资产沉淀路径高度相关，且已有可复用案例与正向收益证据，适合作为当前方案的优先候选。',
    confidenceText: '同类团队近期使用活跃，且该资产在相近目标和场景下沉淀了稳定的复用记录。',
    lineagePrefix: '智能推荐',
  },
  platform: {
    rootLabel: '平台推荐',
    reasonTitle: '为什么值得看',
    summaryText: '该资产来自平台沉淀供给，结合当前入口来源与近期消费信号被优先展示，适合先浏览详情并评估接入价值。',
    confidenceText: '平台会综合资产沉淀状态、近期消费热度与复用记录，优先展示更值得关注的资产。',
    lineagePrefix: '平台推荐',
  },
} as const;

function resolveGroupLabel(canQuickDeploy: boolean) {
  return canQuickDeploy ? 'ready（可直接复用）' : 'adaptable（可加工后使用）';
}

export function RecommendationDetailModal() {
  const detailCardId = useHeroRecommendStore((s) => s.detailCardId);
  const detailAnchor = useHeroRecommendStore((s) => s.detailAnchor);
  const detailSource = useHeroRecommendStore((s) => s.detailSource);
  const grouped = useHeroRecommendStore((s) => s.grouped);
  const platformDetailContext = useHeroRecommendStore((s) => s.platformDetailContext);
  const closeDetail = useHeroRecommendStore((s) => s.closeDetail);
  const candidateIds = useHeroRecommendStore((s) => s.candidateIds);
  const submittedDeployCardIds = useHeroRecommendStore((s) => s.submittedDeployCardIds);
  const addCandidate = useHeroRecommendStore((s) => s.addCandidate);
  const removeCandidate = useHeroRecommendStore((s) => s.removeCandidate);
  const openDeploy = useHeroRecommendStore((s) => s.openDeploy);
  const openDetail = useHeroRecommendStore((s) => s.openDetail);

  const activeGrouped = detailSource === 'platform' ? platformDetailContext.grouped : grouped;
  const sourceCopy = DETAIL_SOURCE_COPY[detailSource];
  const platformReasonTitle =
    detailSource === 'platform'
      ? platformDetailContext.tabKey === 'recent_hot'
        ? '为什么近期热门'
        : '为什么平台推荐'
      : sourceCopy.reasonTitle;

  const card = useMemo(() => {
    if (!detailCardId || !activeGrouped) return null;
    return (
      activeGrouped.ready.find((item) => item.id === detailCardId) ||
      activeGrouped.adaptable.find((item) => item.id === detailCardId) ||
      null
    );
  }, [activeGrouped, detailCardId]);

  const reasonRef = useRef<HTMLDivElement | null>(null);
  const lineageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!card) return;
    const target = detailAnchor === 'reason' ? reasonRef.current : detailAnchor === 'lineage' ? lineageRef.current : null;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [card, detailAnchor]);

  if (!card) return null;

  const added = candidateIds.includes(card.id);
  const canQuickDeploy = card.group === 'ready';
  const submitted = submittedDeployCardIds.includes(card.id);
  const path = [
    sourceCopy.rootLabel,
    ...(detailSource === 'platform' && platformDetailContext.tabLabel ? [platformDetailContext.tabLabel] : []),
    resolveGroupLabel(canQuickDeploy),
    card.name,
  ];
  const factorCards = card.reasons.slice(0, 4).map((reason, index) => ({
    title: index === 0 ? '目标命中' : index === 1 ? '场景复用' : index === 2 ? '落地成本' : '历史效果',
    description: reason,
    metric: card.metrics[index % card.metrics.length]?.value,
  }));
  const scenarioRows = [
    { scene: '主业务场景', actual: card.metrics[0]?.value ?? '稳定', baseline: '行业基线', status: '适合', note: '当前诉求与沉淀案例高度一致。' },
    { scene: '扩展相似场景', actual: card.metrics[1]?.value ?? '可评估', baseline: '中位水平', status: canQuickDeploy ? '适合' : '谨慎使用', note: canQuickDeploy ? '复用成本较低，可直接验证。' : '建议先补充业务约束后再落地。' },
    { scene: '高定制诉求', actual: card.metrics[2]?.value ?? '需观察', baseline: '谨慎阈值', status: canQuickDeploy ? '谨慎使用' : '暂不建议', note: '若涉及复杂链路，优先走试验或标签建设。' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={closeDetail}>
      <div
        role="dialog"
        aria-label={`${card.name}详情`}
        className="max-h-[90vh] w-[760px] max-w-[95vw] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">{path.join(' / ')}</div>
            <h3 className="text-lg font-semibold text-slate-900">{card.name}</h3>
          </div>
          <button type="button" onClick={closeDetail} className="text-sm text-slate-400 hover:text-slate-600">
            关闭
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{card.objectType}</span>
                <span>匹配度 {card.matchScore}%</span>
                <span>{canQuickDeploy ? '结论：可直接复用' : '结论：可加工后使用'}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{card.oneLineReason}</p>
              <div className="flex flex-wrap gap-1.5">
                {card.hitTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {canQuickDeploy ? (
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    if (!submitted) openDeploy(card.id);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitted ? '已提交配置' : '一键配置'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => (added ? removeCandidate(card.id) : addCandidate(card.id))}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    added ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {added ? '已加入候选' : '加入候选'}
                </button>
              )}
              <button
                type="button"
                onClick={() => openDetail(card.id, 'lineage')}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                查看血缘
              </button>
            </div>
          </div>
        </section>

        <section ref={reasonRef} className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">{platformReasonTitle}</h4>
            <button
              type="button"
              onClick={() => openDetail(card.id, 'reason')}
              className="text-xs text-blue-600 hover:underline"
            >
              定位到此
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {factorCards.map((factor) => (
              <div key={`${factor.title}-${factor.description}`} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs text-slate-400">{factor.title}</div>
                <div className="mt-1 text-sm text-slate-800">{factor.description}</div>
                {factor.metric ? <div className="mt-2 text-xs font-medium text-slate-600">{factor.metric}</div> : null}
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-sm leading-relaxed text-slate-700">
            {sourceCopy.summaryText}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">推荐信心来源</h4>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            {sourceCopy.confidenceText}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">已被多团队复用</span>
            <span className="rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">近期使用活跃</span>
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">可解释推荐</span>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">适用场景判断</h4>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">场景</th>
                  <th className="px-3 py-2 font-medium">实际值</th>
                  <th className="px-3 py-2 font-medium">基线</th>
                  <th className="px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scenarioRows.map((item) => (
                  <tr key={item.scene}>
                    <td className="px-3 py-3 text-slate-700">{item.scene}</td>
                    <td className="px-3 py-3 text-slate-600">{item.actual}</td>
                    <td className="px-3 py-3 text-slate-600">{item.baseline}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.status === '适合'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === '谨慎使用'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-500">{scenarioRows[2].note}</div>
        </section>

        <section className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">接入建议</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {card.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-xs text-slate-400">{metric.label}</div>
                <div className="font-medium text-slate-800">{metric.value}</div>
              </div>
            ))}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{canQuickDeploy ? '可先按默认链路快速配置，再基于结果做小步实验。' : '建议先补充加工规则，再进入正式接入。'}</li>
            <li>优先在高匹配业务场景试点，并保留基线对照。</li>
            <li>若需要跨域复用，先确认数据口径和链路成本。</li>
          </ul>
        </section>

        <section ref={lineageRef} className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">数据来源与血缘</h4>
          <details open className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">查看血缘路径与来源说明</summary>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              <div>
                来源路径：{sourceCopy.lineagePrefix}
                {detailSource === 'platform' && platformDetailContext.tabLabel ? ` / ${platformDetailContext.tabLabel}` : ''}
                {' / '}
                {canQuickDeploy ? 'ready 资产' : 'adaptable 资产'} / {card.name}
              </div>
              <div className="flex flex-wrap gap-2">
                {['源数据', '特征加工', '策略沉淀', '质量诊断'].map((node) => (
                  <span key={node} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                    {node}
                  </span>
                ))}
              </div>
              <div>该资产由底层行为数据、加工标签与历史投放反馈共同沉淀，血缘信息仅作决策参考，具体口径以正式接入文档为准。</div>
            </div>
          </details>
        </section>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={closeDetail} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
