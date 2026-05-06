import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getFactoryFeatureConfigApi,
  saveFactoryFeatureConfigApi,
  submitFactoryPipelineApi,
} from '../../api/factory';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatDate } from '../../lib/format';
import { useGlobalState } from '../../store/globalState';
import type { FactoryFeatureConfig } from '../../types';

type StepKey = 'dataSource' | 'idMapping' | 'processingLogic' | 'outputConfig' | 'evaluationBaseline';

const STEP_ITEMS: Array<{ key: StepKey; label: string }> = [
  { key: 'dataSource', label: '数据源' },
  { key: 'idMapping', label: 'ID Mapping' },
  { key: 'processingLogic', label: '加工逻辑' },
  { key: 'outputConfig', label: '输出与评测' },
  { key: 'evaluationBaseline', label: '评测基线' },
];

function editorLabel(type: FactoryFeatureConfig['editorType']) {
  if (type === 'rule') return '规则编辑器';
  if (type === 'sql') return 'SQL 编辑器';
  if (type === 'model') return '模型编辑器';
  if (type === 'dsl') return 'DSL 编辑器';
  return 'Prompt 编辑器';
}

export function FactoryFeatureConfigPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const currentView = useGlobalState((s) => s.currentView);

  const [config, setConfig] = useState<FactoryFeatureConfig | null>(null);
  const [activeStep, setActiveStep] = useState<StepKey>('dataSource');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useBreadcrumb([
    { label: '工坊', to: '/factory/pipelines?view=producer' },
    { label: '配置页' },
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getFactoryFeatureConfigApi(id)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setError('未找到对应特征配置');
          setConfig(null);
          return;
        }
        setConfig(res);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '配置加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stepIndex = useMemo(() => STEP_ITEMS.findIndex((item) => item.key === activeStep), [activeStep]);

  const updateConfig = (updater: (prev: FactoryFeatureConfig) => FactoryFeatureConfig) => {
    setConfig((prev) => (prev ? updater(prev) : prev));
  };

  const saveDraft = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const next = await saveFactoryFeatureConfigApi(id, {
        dataSource: config.dataSource,
        idMapping: config.idMapping,
        processingLogic: config.processingLogic,
        outputConfig: config.outputConfig,
        evaluationBaseline: config.evaluationBaseline,
      });
      if (!next) {
        setError('草稿保存失败');
        return;
      }
      setConfig(next);
      setMessage('草稿已保存');
    } catch (e) {
      setError(e instanceof Error ? e.message : '草稿保存失败');
    } finally {
      setSaving(false);
    }
  };

  const submitPipeline = async () => {
    if (!config) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await saveFactoryFeatureConfigApi(id, {
        dataSource: config.dataSource,
        idMapping: config.idMapping,
        processingLogic: config.processingLogic,
        outputConfig: config.outputConfig,
        evaluationBaseline: config.evaluationBaseline,
      });
      const res = await submitFactoryPipelineApi(id);
      if (!res) {
        setError('提交流水线失败');
        return;
      }
      setMessage(res.message);
      navigate({
        pathname: '/factory/pipelines',
        search: searchParams.toString() ? `?${searchParams.toString()}` : '?view=producer',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交流水线失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentView !== 'producer') {
    return (
      <div className="min-h-screen bg-bg">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="特征加工配置页" subtitle="仅供给视角可编辑配置并提交流水线。" moduleTone="foundry" />
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-sm text-text-2">当前不是供给视角，请切换到 `producer` 后再编辑配置。</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={config ? `${config.featureName} 配置页` : '特征加工配置页'}
          subtitle={config ? `${editorLabel(config.editorType)} · 版本 ${config.versionId}` : '加载配置中'}
          moduleTone="foundry"
          action={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={loading || !config || saving || submitting}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存草稿'}
              </button>
              <button
                type="button"
                onClick={submitPipeline}
                disabled={loading || !config || saving || submitting}
                className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交至流水线'}
              </button>
            </div>
          }
        />

        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        ) : null}
        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading || !config ? (
          <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">
            正在加载配置...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
            <aside className="rounded-card border border-border bg-surface p-4 shadow-sm">
              <div className="text-sm font-medium text-text-3">步骤区块</div>
              <div className="mt-4 space-y-2">
                {STEP_ITEMS.map((item, index) => {
                  const active = item.key === activeStep;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveStep(item.key)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                        active ? 'bg-module-workshop/10 text-module-workshop' : 'bg-bg text-text-2 hover:bg-white'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs">{index + 1}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 rounded-xl bg-bg p-3 text-xs text-text-3">
                最近更新 {formatDate(config.updatedAt)}，当前状态 {config.isDraft ? '草稿' : '已提交'}。
              </div>
            </aside>

            <section className="space-y-5">
              {activeStep === 'dataSource' ? (
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="text-lg font-semibold text-text-1">数据源</div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm text-text-2">
                      主表
                      <input
                        value={config.dataSource.primaryTable}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            dataSource: { ...prev.dataSource, primaryTable: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      分区键
                      <input
                        value={config.dataSource.partitionKey}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            dataSource: { ...prev.dataSource, partitionKey: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2 md:col-span-2">
                      Join 表
                      <input
                        value={config.dataSource.joinTables.join(', ')}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            dataSource: {
                              ...prev.dataSource,
                              joinTables: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                            },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2 md:col-span-2">
                      过滤条件
                      <textarea
                        value={config.dataSource.filters.join('\n')}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            dataSource: {
                              ...prev.dataSource,
                              filters: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
                            },
                          }))
                        }
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {activeStep === 'idMapping' ? (
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="text-lg font-semibold text-text-1">ID Mapping</div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm text-text-2">
                      主 ID 类型
                      <input
                        value={config.idMapping.primaryIdType}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            idMapping: { ...prev.idMapping, primaryIdType: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      Bridge 表
                      <input
                        value={config.idMapping.bridgeTable}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            idMapping: { ...prev.idMapping, bridgeTable: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      TTL 天数
                      <input
                        type="number"
                        value={config.idMapping.ttlDays}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            idMapping: { ...prev.idMapping, ttlDays: Number(e.target.value) || 0 },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2 md:col-span-2">
                      映射策略
                      <textarea
                        rows={4}
                        value={config.idMapping.mappingPolicy}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            idMapping: { ...prev.idMapping, mappingPolicy: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {activeStep === 'processingLogic' ? (
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-text-1">加工逻辑</div>
                    <span className="rounded-full bg-module-workshop/10 px-3 py-1 text-xs font-medium text-module-workshop">
                      {editorLabel(config.editorType)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <label className="text-sm text-text-2">
                      摘要
                      <input
                        value={config.processingLogic.summary}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            processingLogic: { ...prev.processingLogic, summary: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      输入字段
                      <input
                        value={config.processingLogic.inputFields.join(', ')}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            processingLogic: {
                              ...prev.processingLogic,
                              inputFields: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                            },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      输出字段
                      <input
                        value={config.processingLogic.outputField}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            processingLogic: { ...prev.processingLogic, outputField: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      编辑器内容
                      <textarea
                        rows={14}
                        value={config.processingLogic.content}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            processingLogic: { ...prev.processingLogic, content: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-slate-950 px-3 py-3 font-mono text-xs text-emerald-300"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {activeStep === 'outputConfig' ? (
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="text-lg font-semibold text-text-1">输出配置</div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm text-text-2">
                      Namespace
                      <input
                        value={config.outputConfig.namespace}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            outputConfig: { ...prev.outputConfig, namespace: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      Topic
                      <input
                        value={config.outputConfig.topicName}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            outputConfig: { ...prev.outputConfig, topicName: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      分发渠道
                      <input
                        value={config.outputConfig.channel}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            outputConfig: { ...prev.outputConfig, channel: e.target.value as FactoryFeatureConfig['outputConfig']['channel'] },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      SLA 分钟
                      <input
                        type="number"
                        value={config.outputConfig.slaMinutes}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            outputConfig: { ...prev.outputConfig, slaMinutes: Number(e.target.value) || 0 },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2 md:col-span-2">
                      Owner Team
                      <input
                        value={config.outputConfig.ownerTeamName}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            outputConfig: { ...prev.outputConfig, ownerTeamName: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {activeStep === 'evaluationBaseline' ? (
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="text-lg font-semibold text-text-1">评测基线</div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm text-text-2">
                      样本量
                      <input
                        type="number"
                        value={config.evaluationBaseline.sampleSize}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            evaluationBaseline: {
                              ...prev.evaluationBaseline,
                              sampleSize: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                    <label className="text-sm text-text-2">
                      基线报告 ID
                      <input
                        value={config.evaluationBaseline.reportId}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            evaluationBaseline: { ...prev.evaluationBaseline, reportId: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
                    <table className="min-w-full divide-y divide-border text-left">
                      <thead className="bg-bg">
                        <tr className="text-xs uppercase tracking-wide text-text-3">
                          <th className="px-4 py-3 font-medium">维度</th>
                          <th className="px-4 py-3 font-medium">Baseline</th>
                          <th className="px-4 py-3 font-medium">Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {config.evaluationBaseline.metrics.map((metric, index) => (
                          <tr key={metric.dimension}>
                            <td className="px-4 py-3 text-sm font-medium text-text-1">{metric.dimension}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={metric.baselineScore}
                                onChange={(e) =>
                                  updateConfig((prev) => {
                                    const metrics = prev.evaluationBaseline.metrics.slice();
                                    metrics[index] = {
                                      ...metrics[index],
                                      baselineScore: Number(e.target.value) || 0,
                                    };
                                    return {
                                      ...prev,
                                      evaluationBaseline: { ...prev.evaluationBaseline, metrics },
                                    };
                                  })
                                }
                                className="w-28 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={metric.targetScore}
                                onChange={(e) =>
                                  updateConfig((prev) => {
                                    const metrics = prev.evaluationBaseline.metrics.slice();
                                    metrics[index] = {
                                      ...metrics[index],
                                      targetScore: Number(e.target.value) || 0,
                                    };
                                    return {
                                      ...prev,
                                      evaluationBaseline: { ...prev.evaluationBaseline, metrics },
                                    };
                                  })
                                }
                                className="w-28 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-sm">
                <div className="text-sm text-text-2">
                  当前步骤 {stepIndex + 1}/{STEP_ITEMS.length}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={stepIndex === 0}
                    onClick={() => setActiveStep(STEP_ITEMS[Math.max(0, stepIndex - 1)].key)}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    上一步
                  </button>
                  <button
                    type="button"
                    disabled={stepIndex === STEP_ITEMS.length - 1}
                    onClick={() => setActiveStep(STEP_ITEMS[Math.min(STEP_ITEMS.length - 1, stepIndex + 1)].key)}
                    className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    下一步
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
