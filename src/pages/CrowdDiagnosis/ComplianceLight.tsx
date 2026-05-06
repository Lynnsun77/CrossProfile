import { Badge } from '../../components/common/Badge';
import type {
  CrowdComplianceAdvice,
  CrowdComplianceAdviceBucket,
  CrowdComplianceDimension,
  CrowdComplianceRisk,
  CrowdDetail,
} from '../../types';

type ComplianceLightProps = {
  compliance: CrowdDetail['compliance'];
  sectionId?: string;
  title?: string;
};

const DIMENSION_STATUS_META: Record<
  CrowdComplianceDimension['status'],
  { label: string; dotClassName: string; cardClassName: string }
> = {
  green: {
    label: '通过',
    dotClassName: 'bg-emerald-500',
    cardClassName: 'border-emerald-200 bg-emerald-50/60',
  },
  yellow: {
    label: '待评审',
    dotClassName: 'bg-amber-500',
    cardClassName: 'border-amber-200 bg-amber-50/60',
  },
  red: {
    label: '风险',
    dotClassName: 'bg-rose-500',
    cardClassName: 'border-rose-200 bg-rose-50/60',
  },
};

const ADVICE_BUCKET_META: Record<
  CrowdComplianceAdviceBucket,
  {
    title: string;
    subtitle: string;
    columnClassName: string;
    badgeTone: 'market' | 'active' | 'new';
  }
> = {
  recommended: {
    title: '推荐',
    subtitle: '可直接用于投放或继续流转',
    columnClassName: 'border-emerald-200 bg-emerald-50/40',
    badgeTone: 'market',
  },
  review: {
    title: '需评审',
    subtitle: '建议补充材料后进入人工复核',
    columnClassName: 'border-amber-200 bg-amber-50/40',
    badgeTone: 'active',
  },
  forbidden: {
    title: '禁止',
    subtitle: '存在明确限制，不建议继续派发',
    columnClassName: 'border-rose-200 bg-rose-50/40',
    badgeTone: 'new',
  },
};

const RISK_LEVEL_META: Record<
  CrowdComplianceRisk['level'],
  { label: string; className: string }
> = {
  high: {
    label: '高风险',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  mid: {
    label: '中风险',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  low: {
    label: '低风险',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

const ADVICE_BUCKET_ORDER: CrowdComplianceAdviceBucket[] = ['recommended', 'review', 'forbidden'];

function groupAdvicesByBucket(advices: CrowdComplianceAdvice[]) {
  return ADVICE_BUCKET_ORDER.reduce(
    (result, bucket) => {
      result[bucket] = advices.filter((item) => item.bucket === bucket);
      return result;
    },
    {
      recommended: [] as CrowdComplianceAdvice[],
      review: [] as CrowdComplianceAdvice[],
      forbidden: [] as CrowdComplianceAdvice[],
    }
  );
}

export function ComplianceLight({
  compliance,
  sectionId = 'module-4',
  title = '合规建议',
}: ComplianceLightProps) {
  const groupedAdvices = groupAdvicesByBucket(compliance.advices);

  return (
    <section
      id={sectionId}
      className="scroll-mt-32 rounded-card border border-border bg-surface p-6 shadow-sm"
    >
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-medium text-module-market">④ 合规建议</div>
          <h2 className="mt-1 text-xl font-semibold text-text-1">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-text-2">
            展示 4 维红绿灯、AI 场景建议分组和当前风险提示，便于快速判断是否可继续派发。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-text-3">
          <span className="rounded-full border border-border bg-white px-3 py-1.5">
            维度 {compliance.dimensions.length} 项
          </span>
          <span className="rounded-full border border-border bg-white px-3 py-1.5">
            建议 {compliance.advices.length} 条
          </span>
          <span className="rounded-full border border-border bg-white px-3 py-1.5">
            风险 {compliance.risks.length} 项
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {compliance.dimensions.map((dimension) => {
          const statusMeta = DIMENSION_STATUS_META[dimension.status];

          return (
            <article
              key={dimension.key}
              className={`rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${statusMeta.cardClassName}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${statusMeta.dotClassName}`}
                  />
                  <span className="text-sm font-semibold text-text-1">{dimension.label}</span>
                </div>
                <span className="text-xs font-medium text-text-3">{statusMeta.label}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-text-2">{dimension.reason}</p>
              <div className="mt-4 rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs leading-5 text-text-3">
                建议: {dimension.suggestion}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-text-1">AI 场景建议</h3>
            <p className="mt-1 text-sm text-text-3">按推荐、需评审、禁止三列输出当前动作建议。</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {ADVICE_BUCKET_ORDER.map((bucket) => {
            const meta = ADVICE_BUCKET_META[bucket];
            const items = groupedAdvices[bucket];

            return (
              <section key={bucket} className={`rounded-2xl border p-4 ${meta.columnClassName}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-1">{meta.title}</h4>
                      <Badge tone={meta.badgeTone}>{items.length} 条</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-text-3">{meta.subtitle}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {items.length ? (
                    items.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                      >
                        <div className="text-sm font-semibold text-text-1">{item.title}</div>
                        <p className="mt-2 text-sm leading-6 text-text-2">{item.description}</p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-white/70 px-4 py-6 text-sm text-text-3">
                      当前无{meta.title}建议。
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-text-1">风险卡</h3>
          <p className="mt-1 text-sm text-text-3">
            每条风险按 “{`{point} [{regulation}]`}” 结构展示，辅助识别限制项。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {compliance.risks.map((risk) => {
            const riskMeta = RISK_LEVEL_META[risk.level];

            return (
              <article
                key={risk.id}
                className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-6 text-text-1">
                    {risk.point} [{risk.regulation}]
                  </p>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${riskMeta.className}`}
                  >
                    {riskMeta.label}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
