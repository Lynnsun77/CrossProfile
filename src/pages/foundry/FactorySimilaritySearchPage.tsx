import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFactoryCaliberComparisonApi,
  searchFactorySimilarFeaturesApi,
} from '../../api/factory';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { useGlobalState } from '../../store/globalState';
import type { FactoryCaliberCompareRow, FactorySimilaritySearchResult } from '../../types';

function riskLabel(score: number) {
  if (score > 80) return '高相似度预警';
  if (score >= 70) return '中相似度';
  if (score < 60) return '低相似度';
  return '可复用';
}

function riskClass(score: number) {
  if (score > 80) return 'bg-rose-50 text-rose-700';
  if (score >= 70) return 'bg-amber-50 text-amber-700';
  if (score < 60) return 'bg-slate-100 text-slate-600';
  return 'bg-emerald-50 text-emerald-700';
}

function scoreBarClass(score: number) {
  if (score > 80) return 'bg-rose-500';
  if (score >= 70) return 'bg-amber-500';
  if (score < 60) return 'bg-slate-400';
  return 'bg-emerald-500';
}

export function FactorySimilaritySearchPage() {
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);

  const [query, setQuery] = useState('复购');
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FactorySimilaritySearchResult[]>([]);
  const [hasHighSimilarity, setHasHighSimilarity] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareRows, setCompareRows] = useState<FactoryCaliberCompareRow[]>([]);

  useBreadcrumb([
    { label: '工坊', to: '/factory/pipelines?view=producer' },
    { label: '复用检索' },
  ]);

  const runSearch = async (keyword: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchFactorySimilarFeaturesApi({ q: keyword });
      setResults(res.items);
      setHasHighSimilarity(res.hasHighSimilarity);
      setSelectedIds(res.items.slice(0, 2).map((item) => item.featureId));
    } catch (e) {
      setError(e instanceof Error ? e.message : '检索失败');
      setResults([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runSearch(query);
  }, []);

  useEffect(() => {
    if (!selectedIds.length) {
      setCompareRows([]);
      return;
    }
    let cancelled = false;
    setComparing(true);
    getFactoryCaliberComparisonApi({ featureIds: selectedIds })
      .then((res) => {
        if (cancelled) return;
        setCompareRows(res.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '口径对比加载失败');
        setCompareRows([]);
      })
      .finally(() => {
        if (cancelled) return;
        setComparing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  const sortedResults = useMemo(
    () => results.slice().sort((a, b) => b.similarityScore - a.similarityScore),
    [results],
  );

  const toggleSelected = (featureId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(featureId)) return prev.filter((id) => id !== featureId);
      return [...prev, featureId].slice(-4);
    });
  };

  if (currentView !== 'producer') {
    return (
      <div className="min-h-screen bg-bg">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="复用性检索" subtitle="仅供给视角可访问检索与对比能力。" moduleTone="foundry" />
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-sm text-text-2">请切换到 `producer` 视角后使用该页面。</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="复用性检索"
          subtitle="搜索相似特征、做多选口径对比，并给出最小可演示复用建议"
          moduleTone="foundry"
          action={
            <button
              type="button"
              onClick={() => navigate('/factory/pipelines?view=producer')}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop"
            >
              返回产线总览
            </button>
          }
        />

        <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入特征名、复用建议或命中原因"
              className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-1"
            />
            <button
              type="button"
              onClick={() => void runSearch(query)}
              className="rounded-lg bg-module-workshop px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              开始检索
            </button>
          </div>

          {hasHighSimilarity ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              存在超过 80% 的高相似度结果，建议优先复用或先做口径对比再新建。
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-text-1">检索结果</div>
                <div className="mt-1 text-sm text-text-2">按相似度排序，支持多选后对比。</div>
              </div>
              <div className="text-sm text-text-3">已选 {selectedIds.length} 项</div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
                正在检索...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-bg">
                    <tr className="text-xs uppercase tracking-wide text-text-3">
                      <th className="px-4 py-3 font-medium">选择</th>
                      <th className="px-4 py-3 font-medium">特征</th>
                      <th className="px-4 py-3 font-medium">相似度</th>
                      <th className="px-4 py-3 font-medium">质量</th>
                      <th className="px-4 py-3 font-medium">建议</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {sortedResults.map((item) => {
                      const selected = selectedIds.includes(item.featureId);
                      return (
                        <tr key={item.featureId} className={selected ? 'bg-module-workshop/5' : undefined}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelected(item.featureId)}
                              className="h-4 w-4 rounded border-border"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-text-1">{item.featureName}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-3">
                              <span>{item.type}</span>
                              <span>{item.domain}</span>
                              <span>{item.lifecycleStage}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-40">
                              <div className="flex items-center justify-between text-sm">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskClass(item.similarityScore)}`}>
                                  {riskLabel(item.similarityScore)}
                                </span>
                                <span className="font-semibold text-text-1">{item.similarityScore}%</span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-gray-200">
                                <div className={`h-2 rounded-full ${scoreBarClass(item.similarityScore)}`} style={{ width: `${item.similarityScore}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-text-2">
                            准确率 {(item.accuracy * 100).toFixed(1)}%
                            <br />
                            覆盖率 {(item.coverage * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-text-1">{item.reuseSuggestion}</div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {item.hitReasons.map((reason) => (
                                <span key={`${item.featureId}-${reason}`} className="rounded-full bg-bg px-2 py-1 text-xs text-text-3">
                                  {reason}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedIds([item.featureId])}
                                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop"
                              >
                                对比
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/factory/features/${item.featureId}/config?view=producer`)}
                                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop"
                              >
                                复用建议
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">口径对比表</div>
              <div className="mt-1 text-sm text-text-2">多选后自动请求对比接口，最多保留最近 4 项。</div>

              {comparing ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
                  正在加载口径对比...
                </div>
              ) : compareRows.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
                  选择至少 1 个结果后展示对比。
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {compareRows.map((row) => (
                    <div key={row.featureId} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-text-1">{row.featureName}</div>
                        <div className="text-xs text-text-3">{row.caliber}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-text-2">
                        <div>数据源: {row.dataSource}</div>
                        <div>更新频率: {row.updateFrequency}</div>
                        <div>覆盖率: {(row.coverageRate * 100).toFixed(1)}%</div>
                        <div>准确率: {(row.accuracyRate * 100).toFixed(1)}%</div>
                      </div>
                      <div className="mt-2 text-xs text-text-3">Owner: {row.ownerTeamName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">最小演示交互</div>
              <div className="mt-4 space-y-3 text-sm text-text-2">
                <div className="rounded-xl bg-bg p-4">{'`>80%` 显示高相似度预警，建议优先复用。'}</div>
                <div className="rounded-xl bg-bg p-4">{'`70-80%` 标记为中相似度，建议先做口径对比。'}</div>
                <div className="rounded-xl bg-bg p-4">{'`<60%` 标记为低相似度，可作为新增候选继续配置。'}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
