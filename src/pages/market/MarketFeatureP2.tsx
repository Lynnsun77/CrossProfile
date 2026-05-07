import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatLargeNumber } from '../../lib/format';
import { getCrowdDetailById } from '../../mock';

type SampleCard = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
};

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

function parseSegment(rawSegment: string | null) {
  if (!rawSegment) {
    return {
      system: 'unknown',
      segKey: 'unknown',
      label: '未指定样本分层',
    };
  }

  const [system, segKey] = rawSegment.split(':');
  const isLifestyle = system === 'lifestyle';

  return {
    system,
    segKey,
    label: isLifestyle ? `生服 ${segKey}` : `电商 ${segKey}`,
  };
}

function buildSampleCards(crowdName: string, systemLabel: string, segKey: string): SampleCard[] {
  return [
    {
      id: `${segKey}-1`,
      title: `${crowdName} - 高意图样本`,
      summary: `近 30 天内与 ${systemLabel} 分层 ${segKey} 的行为强相关，表现出更高的点击与成交意图。`,
      tags: ['近期活跃', '高转化', '优先观察'],
    },
    {
      id: `${segKey}-2`,
      title: `${crowdName} - 稳定承接样本`,
      summary: `对当前分层的规则命中稳定，适合作为策略回看和渠道验证的参考样本。`,
      tags: ['稳定命中', '适合复核', '策略验证'],
    },
    {
      id: `${segKey}-3`,
      title: `${crowdName} - 边界样本`,
      summary: `与主分层接近但仍存在规则边界差异，可辅助判断是否需要去 Foundry 继续收紧条件。`,
      tags: ['边界样本', '需复核', '可继续圈选'],
    },
  ];
}

export function MarketFeatureP2() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const segment = parseSegment(searchParams.get('seg'));
  const detail = getCrowdDetailById(id);
  const sampleCards = buildSampleCards(detail.crowdName, segment.label, segment.segKey);
  const foundryPath = `/factory/pack?base=${detail.id}`;

  useBreadcrumb([
    { label: '智能推荐', to: '/marketplace' },
    { label: '人群诊断', to: `/marketplace/crowd/${detail.id}` },
    { label: '查看资产' },
  ]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="查看资产样本"
          subtitle="智能推荐入口强调查看资产与样本理解，承接双体系分布下钻后的只读预览。"
          moduleTone="market"
          extra={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/marketplace/crowd/${detail.id}`}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/30 hover:text-module-market"
              >
                返回诊断页
              </Link>
              <button
                type="button"
                onClick={() => {
                  track('crowd_p2_go_foundry', {
                    crowdId: detail.id,
                    segment: searchParams.get('seg'),
                    foundryPath,
                  });
                  navigate(foundryPath);
                }}
                className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                去 Foundry 继续圈选
              </button>
            </div>
          }
        />

        <section className="rounded-[24px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="market">P2 样本</Badge>
                <Badge tone="feature">{segment.label}</Badge>
                <Badge tone="foundry">只读</Badge>
              </div>
              <h1 className="text-2xl font-semibold text-text-1">{detail.crowdName}</h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-text-2">
                当前页面根据 `seg={searchParams.get('seg') ?? 'unknown'}` 展示对应分层的只读样本，用于帮助理解该分层人群长什么样；如需改条件，统一跳转到 Foundry 处理。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm text-text-3">人群规模</div>
                <div className="mt-2 text-2xl font-semibold text-text-1">
                  {formatLargeNumber(detail.scale)}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm text-text-3">分层键</div>
                <div className="mt-2 text-2xl font-semibold text-text-1">{segment.segKey}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-module-workshop/20 bg-module-workshop/5 px-4 py-3 text-sm text-module-workshop">
            🔒 本页只读；如需修改条件请点击右上角「去 Foundry 继续圈选」
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-1">样本预览</h2>
              <p className="mt-1 text-sm text-text-3">使用 mock 样本卡承接 P2 跳转，重点展示分层特征与边界样本。</p>
            </div>
            <Badge tone="market">{sampleCards.length} 张</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {sampleCards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-border bg-white p-5">
                <div className="text-base font-semibold text-text-1">{card.title}</div>
                <p className="mt-2 text-sm leading-6 text-text-2">{card.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
