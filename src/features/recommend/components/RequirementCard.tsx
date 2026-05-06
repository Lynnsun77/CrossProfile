import { useRecommendStore } from '../store/useRecommendStore';

export function RequirementCard({ onConfirm }: { onConfirm: () => void }) {
  const requirement = useRecommendStore((s) => s.requirement);
  const phase = useRecommendStore((s) => s.phase);
  const docUrl = useRecommendStore((s) => s.docUrl);
  const docTitle = useRecommendStore((s) => s.docTitle);
  const startSession = useRecommendStore((s) => s.startSession);
  if (!requirement) return null;

  const locked = phase !== 'parse';
  const problemCrowds = requirement.problems.map((item, index) => ({
    key: item.id,
    label: `${item.segment}：${item.description}`,
    priority: index + 1,
  }));
  const scopes = [
    { key: 'self', label: '当前商家跃迁人群', checked: requirement.miningScope.selfHistory },
    { key: 'bench', label: '标杆商家', checked: requirement.miningScope.benchmark },
    { key: 'cross', label: '跨行业相似', checked: requirement.miningScope.crossIndustry },
  ];
  const actions = [
    { key: 'product', label: '商品优化', checked: requirement.actionTypes.product },
    { key: 'campaign', label: '营销活动', checked: requirement.actionTypes.marketing },
    { key: 'content', label: '内容优化', checked: requirement.actionTypes.content },
    { key: 'acquire', label: '人群拉新', checked: requirement.actionTypes.acquisition },
  ];
  const features = [
    { key: 'power', label: '消费力', checked: requirement.featureDims.consumeLevel },
    { key: 'scene', label: '消费场景', checked: requirement.featureDims.scene },
    { key: 'interest', label: '兴趣关键词', checked: requirement.featureDims.keyword },
    { key: 'freq', label: '频次', checked: requirement.featureDims.frequency },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold">📋 我理解的你的需求（可编辑）</div>
        <div className="text-xs text-gray-400">置信度 {(requirement.confidence * 100).toFixed(0)}%</div>
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <Field label="行业">{requirement.industry}</Field>
        <Field label="商家">
          {requirement.merchant.id} · {requirement.merchant.name}
        </Field>
      </div>

      <Section title="🎯 问题人群（优先级可拖动排序）">
        <ul className="space-y-1 text-sm">
          {problemCrowds.map((crowd) => (
            <li key={crowd.key}>
              ① {crowd.label}
            </li>
          ))}
        </ul>
      </Section>

      <CheckRow title="🔍 挖掘范围" items={scopes} />
      <CheckRow title="🎬 关注动作类型" items={actions} />
      <CheckRow title="📐 期望特征维度" items={features} />

      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        来源文档：{docTitle ?? requirement.docTitle ?? '未命名文档'}{(docUrl ?? requirement.docUrl) ? ' · 已绑定飞书链接' : ''}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm text-gray-600"
          disabled={locked}
          onClick={() => startSession(docUrl, docTitle, { manualGateAfterParse: true })}
        >
          重新解析
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={locked}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm text-white disabled:bg-gray-300"
        >
          确认并推荐 →
        </button>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="text-gray-500">{label}:</span> <span className="font-medium">{children}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-1 text-xs text-gray-500">{title}</div>
    {children}
  </div>
);

const CheckRow = ({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; checked: boolean }>;
}) => (
  <Section title={title}>
    <div className="flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <span
          key={item.key}
          className={`rounded border px-2 py-0.5 text-xs ${
            item.checked ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          {item.checked ? '☑' : '☐'} {item.label}
        </span>
      ))}
    </div>
  </Section>
);
