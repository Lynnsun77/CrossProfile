import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecommendStore } from '../store/useRecommendStore';
import type { RecommendCard } from '../types';
import type { AssetDrawerSource, RecommendSection, RecommendSlotKind } from '../types';

const COHORT_SUBSCRIPTIONS: { team: string; scenario: string; status: 'active' | 'trial' }[] = [
  { team: '生服增长', scenario: '夺投放', status: 'active' },
  { team: '推荐算法', scenario: '召回增强', status: 'trial' },
  { team: 'CRM 团队', scenario: '流失挽回', status: 'active' },
];

const LINEAGE_CHAIN = ['电商 BTM', '生服 BTM+', 'ID Mapping', '夺敏感评分', '诊断'];
const LINEAGE_DETAIL = '链路：source-ecom → process-map → process-score → process-diagnose';

const LINEAGE_TRANSLATIONS: Record<string, string> = {
  '电商 BTM': '电商业务的底层交易和行为主题数据',
  '生服 BTM+': '生活服务业务的底层主题数据，含到店/到家行为',
  'ID Mapping': '跨端/跨业务的用户身份打通表',
  '夺敏感评分': '价格/折扣敏感度评分，衡量用户对优惠的响应度',
  '诊断': '质量诊断与业务规则校验层，保障数据可信',
};

const LINEAGE_NARRATIVE =
  '这个数据融合了电商交易库和生服行为库的底层数据，经过 ID 打通和敏感度评分后，再由诊断层做质量校验。';

const BENCHMARK_ROWS: {
  scene: string;
  baseline: string;
  actual: string;
  pass: boolean;
  label: string;
}[] = [
  { scene: '营销触达', baseline: '85%', actual: '88%', pass: true, label: '通过' },
  { scene: '推荐排序', baseline: '80%', actual: '78%', pass: false, label: '未达标' },
  { scene: '流失挽回', baseline: '82%', actual: '86%', pass: true, label: '通过' },
];

const IMPACT_BULLETS = [
  '建议与「生服 BTM+」一起订阅，构建完整的人群链路',
  '接入时优先使用增量同步，可降低回刷成本',
  '建议联动基准对照，观察未达标场景的迭代收敛',
];

const DECISION_DRAWER_SECTIONS = [
  { id: 'reason', label: '推荐理由' },
  { id: 'audience', label: '人群构成' },
  { id: 'subscription', label: '订阅行为' },
  { id: 'lineage', label: '血缘透视' },
  { id: 'benchmark', label: '基准线对照' },
  { id: 'impact', label: '订阅影响' },
] as const;

type DecisionDrawerSectionId = (typeof DECISION_DRAWER_SECTIONS)[number]['id'];

const DRAWER_COPY: Record<
  AssetDrawerSource,
  {
    rootLabel: string;
    reasonTitle: string;
    audienceTitle: string;
    subscriptionTitle: string;
    impactTitle: string;
    confidenceLabel: string;
    deployButtonLabel: string;
  }
> = {
  intelligent_recommend: {
    rootLabel: '智能推荐',
    reasonTitle: '推荐理由',
    audienceTitle: '人群构成白话解析',
    subscriptionTitle: '同类用户订阅行为',
    impactTitle: '订阅影响说明',
    confidenceLabel: '相似度',
    deployButtonLabel: '去投放',
  },
  platform_recommend: {
    rootLabel: '平台推荐',
    reasonTitle: '入选理由',
    audienceTitle: '资产画像白话解析',
    subscriptionTitle: '平台消费热度',
    impactTitle: '使用建议',
    confidenceLabel: '推荐度',
    deployButtonLabel: '去使用',
  },
};

function resolveDrawerSource(source?: AssetDrawerSource): AssetDrawerSource {
  return source === 'platform_recommend' ? 'platform_recommend' : 'intelligent_recommend';
}

export function findCardById(groups: ReturnType<typeof useRecommendStore.getState>['groups'], cardId: string | null): RecommendCard | null {
  if (!cardId) return null;
  for (const group of groups) {
    const hit = group.cards.find((card) => card.id === cardId);
    if (hit) return hit;
  }
  return null;
}

type ParagraphKind = 'ready' | 'adaptable';

function paragraphLabel(kind: ParagraphKind) {
  // Copy must match spec:
  // ✨ 段落 = 可直接复用，🧩 段落 = 可加工后使用。
  return kind === 'ready' ? '✨ 可直接复用' : '🧩 可加工后使用';
}

function resolveParagraphKind(sectionId: RecommendSection['section_id']): ParagraphKind | null {
  if (sectionId === 'paragraph_1') return 'ready';
  if (sectionId === 'paragraph_2') return 'adaptable';
  return null;
}

function resolveGroupName(paragraphKind: ParagraphKind, slotKind: Extract<RecommendSlotKind, 'card_list' | 'combo_group'>) {
  if (paragraphKind === 'ready' && slotKind === 'card_list') return '推荐组 1 · AI 推荐';
  if (paragraphKind === 'ready' && slotKind === 'combo_group') return '推荐组 2 · 组合推荐';
  if (paragraphKind === 'adaptable' && slotKind === 'card_list') return '推荐组 3 · 相似资产';
  return '推荐组 4 · 相似组合';
}

export function findParagraphMetaByCardId(
  sections: RecommendSection[],
  cardId: string | null,
): { paragraphKind: ParagraphKind; slotKind: Extract<RecommendSlotKind, 'card_list' | 'combo_group'> } | null {
  if (!cardId) return null;
  for (const section of sections) {
    const paragraphKind = resolveParagraphKind(section.section_id);
    if (!paragraphKind) continue;
    for (const slot of section.slots) {
      if (slot.kind === 'card_list') {
        if ((slot.cards ?? []).some((c) => c.id === cardId)) return { paragraphKind, slotKind: 'card_list' };
      }
      if (slot.kind === 'combo_group') {
        const hit = (slot.groups ?? []).some((g) => (g.cards ?? []).some((c) => c.id === cardId));
        if (hit) return { paragraphKind, slotKind: 'combo_group' };
      }
    }
  }
  return null;
}

export function buildDrawerBreadcrumb(
  source: AssetDrawerSource | undefined,
  cardTitle: string | undefined,
  paragraphMeta: { paragraphKind: ParagraphKind; slotKind: Extract<RecommendSlotKind, 'card_list' | 'combo_group'> } | null,
) {
  const rootLabel = DRAWER_COPY[resolveDrawerSource(source)].rootLabel;
  const title = cardTitle ?? '资产详情';
  if (!paragraphMeta) {
    return `${rootLabel} › ${title}`;
  }
  return `${rootLabel} › ${paragraphLabel(paragraphMeta.paragraphKind)} › ${resolveGroupName(paragraphMeta.paragraphKind, paragraphMeta.slotKind)} › ${title}`;
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold text-gray-800">{children}</h3>;
}

function StatusBadge({
  active,
  inactiveLabel,
  activeLabel,
}: {
  active: boolean;
  inactiveLabel: string;
  activeLabel: string;
}) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export interface AssetDrawerProps {}

export function AssetDrawer(_props: AssetDrawerProps) {
  const drawer = useRecommendStore((s) => s.drawer);
  const closeDrawer = useRecommendStore((s) => s.closeDrawer);
  const openDeploy = useRecommendStore((s) => s.openDeploy);
  const groups = useRecommendStore((s) => s.groups);
  const sections = useRecommendStore((s) => s.sections);

  const [peerOpen, setPeerOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<DecisionDrawerSectionId>('reason');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<DecisionDrawerSectionId, HTMLElement | null>>({
    reason: null,
    audience: null,
    subscription: null,
    lineage: null,
    benchmark: null,
    impact: null,
  });

  const card = useMemo(() => findCardById(groups, drawer.cardId), [groups, drawer.cardId]);
  const paragraphMeta = useMemo(
    () => findParagraphMetaByCardId(sections, drawer.cardId),
    [sections, drawer.cardId],
  );
  const drawerSource = resolveDrawerSource(drawer.source);
  const copy = DRAWER_COPY[drawerSource];
  const breadcrumb = useMemo(
    () => buildDrawerBreadcrumb(drawerSource, card?.title, paragraphMeta),
    [drawerSource, paragraphMeta, card?.title],
  );

  useEffect(() => {
    if (!drawer.open) return;
    setPeerOpen(false);
    setActiveAnchor('reason');
  }, [drawer.open, drawer.cardId]);

  useEffect(() => {
    if (!drawer.open) return;
    const container = contentRef.current;
    if (!container) return;

    const resolveActiveAnchor = () => {
      const threshold = container.scrollTop + 72;
      let nextAnchor: DecisionDrawerSectionId = DECISION_DRAWER_SECTIONS[0].id;

      DECISION_DRAWER_SECTIONS.forEach(({ id }) => {
        const section = sectionRefs.current[id];
        if (!section) return;
        if (section.offsetTop <= threshold) {
          nextAnchor = id;
        }
      });

      setActiveAnchor((prev) => (prev === nextAnchor ? prev : nextAnchor));
    };

    resolveActiveAnchor();
    container.addEventListener('scroll', resolveActiveAnchor, { passive: true });
    return () => container.removeEventListener('scroll', resolveActiveAnchor);
  }, [drawer.open, drawer.cardId]);

  if (!drawer.open) return null;

  if (!card) {
    return (
      <aside
        role="dialog"
        aria-label="资产详情"
        className="fixed right-0 top-0 z-50 flex h-screen w-[480px] max-w-[560px] flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="text-sm font-semibold text-gray-900">资产详情</div>
          <button
            type="button"
            aria-label="关闭"
            onClick={closeDrawer}
            className="rounded-md px-2 py-1 text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ×
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">未找到资产</div>
      </aside>
    );
  }

  const confidencePct = Math.round((card.confidence ?? 0) * 100);
  const offline = card.healthStatus === 'offline';

  const socialProof =
    COHORT_SUBSCRIPTIONS.length >= 2
      ? `${COHORT_SUBSCRIPTIONS[0].team} 和 ${COHORT_SUBSCRIPTIONS[1].team} 本月都在高频使用此人群，效果良好。`
      : '生服增长团队和 CRM 团队本月都在高频使用此人群进行召回，效果良好。';

  const handleGoDeploy = () => {
    if (offline) return;
    openDeploy(card.id);
  };

  const registerSection = (id: DecisionDrawerSectionId) => (node: HTMLElement | null) => {
    sectionRefs.current[id] = node;
  };

  const handleAnchorClick = (id: DecisionDrawerSectionId) => {
    setActiveAnchor(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside
      role="dialog"
      aria-label={card.title}
      className="fixed right-0 top-0 z-50 flex h-screen w-[480px] max-w-[560px] flex-col bg-white shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="truncate text-sm font-semibold text-gray-900">{card.title}</div>
        <button
          type="button"
          aria-label="关闭"
          onClick={closeDrawer}
          className="rounded-md px-2 py-1 text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ×
        </button>
      </header>

      <div className="border-b border-gray-100 px-5 py-2 text-xs text-gray-500">{breadcrumb}</div>

      <div className="border-b border-gray-100 px-3 py-2">
        <nav aria-label="决策抽屉锚点" className="flex gap-1 overflow-x-auto">
          {DECISION_DRAWER_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-pressed={activeAnchor === section.id}
              onClick={() => handleAnchorClick(section.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition ${
                activeAnchor === section.id
                  ? 'bg-indigo-50 font-medium text-indigo-700 ring-1 ring-indigo-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4">
        {/* 1. 推荐理由 */}
        <section id="decision-drawer-reason" ref={registerSection('reason')} className="space-y-3 scroll-mt-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{copy.reasonTitle}</SectionTitle>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
              {copy.confidenceLabel} {confidencePct}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
              <div className="mb-1 font-medium text-gray-700">消费历史</div>
              <div>
                {card.consumers?.length ?? 0} 个团队持续订阅 / 近 90 天稳定使用
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
              <div className="mb-1 font-medium text-gray-700">质量红线</div>
              <div>准确率 88% / 覆盖 71%</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
              <div className="mb-1 font-medium text-gray-700">收益表征</div>
              <div>{card.kpi || '+28%'}，AB 为正</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
              <div className="mb-1 font-medium text-gray-700">人群规模</div>
              <div className="text-[11px] text-gray-700">128 万</div>
            </div>
          </div>
        </section>

        {/* 1.5 人群构成白话解析 */}
        <section id="decision-drawer-audience" ref={registerSection('audience')} className="mt-6 space-y-2 scroll-mt-4">
          <SectionTitle>{copy.audienceTitle}</SectionTitle>
          <div className="rounded-lg bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-700 ring-1 ring-gray-100">
            {card.audience_narrative ??
              '该人群基于历史消费与标签匹配筛选得出，涵盖近期在相关品类有过活跃行为的用户。'}
          </div>
        </section>

        {/* 2. 同类用户订阅行为 */}
        <section id="decision-drawer-subscription" ref={registerSection('subscription')} className="mt-6 space-y-2 scroll-mt-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{copy.subscriptionTitle}</SectionTitle>
            <button
              type="button"
              onClick={() => setPeerOpen((v) => !v)}
              className="text-[11px] text-indigo-600 hover:text-indigo-700"
            >
              {peerOpen ? '收起订阅明细 ▴' : '查看订阅明细 ▾'}
            </button>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-[12px] leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
            {socialProof}
          </div>
          {peerOpen && (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {COHORT_SUBSCRIPTIONS.map((item) => (
                <div
                  key={`${item.team}-${item.scenario}`}
                  className="flex items-center justify-between px-3 py-2 text-[12px]"
                >
                  <div className="text-gray-800">
                    {item.team} · <span className="text-gray-500">{item.scenario}</span>
                  </div>
                  <StatusBadge active={item.status === 'active'} activeLabel="active" inactiveLabel="trial" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. 血缘透视 */}
        <section id="decision-drawer-lineage" ref={registerSection('lineage')} className="mt-6 space-y-2 scroll-mt-4">
          <SectionTitle>血缘透视</SectionTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            {LINEAGE_CHAIN.map((node, idx) => (
              <span key={node} className="flex items-center gap-1.5">
                <span
                  title={LINEAGE_TRANSLATIONS[node] ?? node}
                  className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 ring-1 ring-sky-200"
                >
                  {node}
                </span>
                {idx < LINEAGE_CHAIN.length - 1 && <span className="text-xs text-gray-400">→</span>}
              </span>
            ))}
          </div>
          <div className="text-[11px] text-gray-500">{LINEAGE_NARRATIVE}</div>
          <div className="text-[11px] text-gray-400">{LINEAGE_DETAIL}</div>
        </section>

        {/* 4. 分场景基准线对照 */}
        <section id="decision-drawer-benchmark" ref={registerSection('benchmark')} className="mt-6 space-y-2 scroll-mt-4">
          <SectionTitle>分场景基准线对照</SectionTitle>
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">场景</th>
                  <th className="px-3 py-2 text-left font-medium">基准线</th>
                  <th className="px-3 py-2 text-left font-medium">实际值</th>
                  <th className="px-3 py-2 text-left font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {BENCHMARK_ROWS.map((row) => (
                  <tr key={row.scene}>
                    <td className="px-3 py-2 text-gray-700">{row.scene}</td>
                    <td className="px-3 py-2 text-gray-600">{row.baseline}</td>
                    <td className="px-3 py-2 text-gray-600">{row.actual}</td>
                    <td className="px-3 py-2">
                      <StatusBadge active={row.pass} activeLabel={row.label} inactiveLabel={row.label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. 订阅影响说明 */}
        <section id="decision-drawer-impact" ref={registerSection('impact')} className="mt-6 space-y-2 scroll-mt-4">
          <SectionTitle>{copy.impactTitle}</SectionTitle>
          <div className="flex flex-wrap gap-4 text-[11px] text-gray-600">
            <span>预估触达 128 万</span>
            <span>预估增益 +28%</span>
            <span>接入成本 低</span>
          </div>
          <ul className="list-disc space-y-1 pl-4 text-[11px] text-gray-600">
            {IMPACT_BULLETS.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="border-t border-gray-100 px-5 py-3">
        {offline ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-400"
          >
            资产已下线
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGoDeploy}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            {copy.deployButtonLabel}
          </button>
        )}
      </footer>
    </aside>
  );
}

export default AssetDrawer;
