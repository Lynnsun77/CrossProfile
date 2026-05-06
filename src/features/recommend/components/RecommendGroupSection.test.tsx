import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecommendGroupSection } from './RecommendGroupSection';
import { useRecommendStore } from '../store/useRecommendStore';
import type { RecommendCard, RecommendGroup, RecommendSection } from '../types';

function makeCard(partial: Partial<RecommendCard> & Pick<RecommendCard, 'id' | 'title' | 'confidence'>): RecommendCard {
  const { id, title, confidence } = partial;
  return {
    ...partial,
    id,
    title,
    confidence,
    problemId: partial.problemId ?? `p_${id}`,
    actionType: partial.actionType ?? 'product',
    action: partial.action ?? 'product',
    detail: partial.detail ?? `detail_${id}`,
    referencedAssets: partial.referencedAssets ?? [],
    expectedKpi: partial.expectedKpi ?? { metric: 'GMV', lift: 0.1 },
    reasoning: partial.reasoning ?? `reasoning_${id}`,
    status: partial.status ?? 'recommended',
    crowd: partial.crowd ?? '默认',
    desc: partial.desc ?? `desc_${id}`,
    refs: partial.refs ?? [],
    kpi: partial.kpi ?? 'GMV ↑ 10%',
    tag: partial.tag ?? '🟢',
  };
}

describe('RecommendGroupSection', () => {
  beforeEach(() => {
    useRecommendStore.getState().reset();
    useRecommendStore.setState({
      input: { goalId: 'goal_1', sceneId: 'ecom', text: 'input_text_fallback' },
      intent: { ...useRecommendStore.getState().intent, text: 'query_帮我找会员复购资产' },
    });
  });

  afterEach(() => {
    useRecommendStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('三段式：ready / adaptable / fallback 的渲染顺序与存在性', () => {
    const groups: RecommendGroup[] = [
      {
        id: 'ai',
        kind: 'ai',
        title: '推荐组 1 · AI 推荐',
        cards: [
          makeCard({ id: 'r1', title: 'ready_1', confidence: 0.86, healthStatus: 'healthy', reason: 'ready_reason' }),
          makeCard({ id: 'a1', title: 'adapt_1', confidence: 0.7, healthStatus: 'warning' }),
          makeCard({ id: 'a2', title: 'adapt_2', confidence: 0.7, healthStatus: 'healthy' }),
          makeCard({ id: 'a3', title: 'adapt_3', confidence: 0.7, healthStatus: 'healthy' }),
        ],
      },
    ];
    useRecommendStore.getState().setGroups(groups);

    render(<RecommendGroupSection />);

    const readyBadge = screen.getByText('ready（可直接复用）');
    const adaptableBadge = screen.getByText('adaptable（可加工后使用）');
    const fallbackTitle = screen.getByText('都不符合你的诉求？');

    // 顺序：ready 在 adaptable 之前，adaptable 在 fallback 之前
    expect(readyBadge.compareDocumentPosition(adaptableBadge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(adaptableBadge.compareDocumentPosition(fallbackTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('边界：结果数=1 时视为 ready，仅渲染 ready + fallback', () => {
    useRecommendStore.getState().setGroups([
      {
        id: 'ai',
        kind: 'ai',
        title: '推荐组 1 · AI 推荐',
        cards: [makeCard({ id: 'only', title: 'only_1', confidence: 0.2, healthStatus: 'offline' })],
      },
    ]);

    render(<RecommendGroupSection />);
    expect(screen.getByText('ready（可直接复用）')).toBeInTheDocument();
    expect(screen.queryByText('adaptable（可加工后使用）')).not.toBeInTheDocument();
    expect(screen.getByText('都不符合你的诉求？')).toBeInTheDocument();
    const countNodes = screen
      .getAllByText((_, node) => Boolean(node?.textContent?.replace(/\s+/g, ' ').includes('共 1 条')))
      // Filter out parent nodes that match only because children match.
      .filter((node) => Array.from(node.children).every((c) => !c.textContent?.replace(/\s+/g, ' ').includes('共 1 条')));
    expect(countNodes.length).toBeGreaterThan(0);
  });

  it('边界：结果数=0 时仅 fallback，且展示升级文案', () => {
    useRecommendStore.getState().setGroups([]);

    render(<RecommendGroupSection />);
    expect(screen.queryByText('ready（可直接复用）')).not.toBeInTheDocument();
    expect(screen.queryByText('adaptable（可加工后使用）')).not.toBeInTheDocument();
    expect(screen.getByText('都不符合你的诉求？')).toBeInTheDocument();
    expect(screen.getByText('暂未命中画像资产，帮我们补充标签建设')).toBeInTheDocument();
  });

  it('边界：ready 为空时 adaptable 升级，仅渲染 paragraph_1 + fallback', () => {
    // 3 个可加工候选，满足 adaptableSingle + mockComboGroup，但没有任何 ready
    useRecommendStore.getState().setGroups([
      {
        id: 'ai',
        kind: 'ai',
        title: '推荐组 1 · AI 推荐',
        cards: [
          makeCard({ id: 'a1', title: 'adapt_1', confidence: 0.7, healthStatus: 'warning' }),
          makeCard({ id: 'a2', title: 'adapt_2', confidence: 0.7, healthStatus: 'healthy' }),
          makeCard({ id: 'a3', title: 'adapt_3', confidence: 0.7, healthStatus: 'healthy' }),
        ],
      },
    ]);

    render(<RecommendGroupSection />);
    expect(screen.queryByText('ready（可直接复用）')).not.toBeInTheDocument();
    expect(screen.getByText('adaptable（可加工后使用）')).toBeInTheDocument();
    expect(screen.getByText('都不符合你的诉求？')).toBeInTheDocument();
  });

  it('段落三 CTA：预填 goal/scene/query/source（source 固定 no_match_section_1_2）', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    useRecommendStore.getState().setGroups([]); // 强制仅 fallback

    render(<RecommendGroupSection />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '去提需更多画像标签建设' }));
    });

    expect(openSpy).toHaveBeenCalled();
    const href = String(openSpy.mock.calls[0]?.[0] ?? '');
    const url = new URL(href, 'http://localhost');
    expect(url.pathname).toBe('/asset/report');
    expect(url.searchParams.get('goal')).toBe('goal_1');
    expect(url.searchParams.get('scene')).toBe('ecom');
    expect(url.searchParams.get('query')).toBe('query_帮我找会员复购资产');
    expect(url.searchParams.get('source')).toBe('no_match_section_1_2');
  });

  it('点击“查看详情”不会触发外层跳转容器 onClick，仅打开抽屉', () => {
    const wrapperClickSpy = vi.fn();
    const clickedCardId = 'r_detail_1';

    const sections: RecommendSection[] = [
      {
        section_id: 'paragraph_1',
        emoji: '🤖',
        title: '以下画像资产高度匹配，可以直接配置使用',
        subtitle: '基于你的诉求生成的可执行建议',
        bg_style: 'plain',
        slots: [
          {
            kind: 'card_list',
            cards: [makeCard({ id: clickedCardId, title: 'ready_detail_1', confidence: 0.9, healthStatus: 'healthy' })],
            adapt: { type: 'recommend_cards', sourceKind: 'ready_ai', sourceId: 'ai' },
          },
        ],
      },
      {
        section_id: 'paragraph_3',
        emoji: '🧭',
        title: '都不符合你的诉求？',
        subtitle: '可能是资产尚未入驻市集，或诉求过于定制',
        bg_style: 'muted',
        slots: [
          {
            kind: 'fallback_cta',
            cta: {
              primary: { text: '去提需更多画像标签建设', action: 'go_report' },
              secondary: { text: '联系资产 Owner', action: 'contact_owner' },
            },
          },
        ],
      },
    ];

    // 提供 groups（满足外层数据结构），并通过 sections 控制段落渲染与文案/卡位。
    const groups: RecommendGroup[] = [
      {
        id: 'ai',
        kind: 'ai',
        title: '推荐组 1 · AI 推荐',
        cards: [makeCard({ id: clickedCardId, title: 'ready_detail_1', confidence: 0.9, healthStatus: 'healthy' })],
      },
      { id: 'fallback', kind: 'fallback', title: '都不符合你的诉求？', cards: [] },
    ];

    useRecommendStore.setState({ groups, sections });

    render(
      <div onClick={wrapperClickSpy}>
        <RecommendGroupSection />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: '查看详情' }));

    expect(wrapperClickSpy).not.toHaveBeenCalled();
    const drawer = useRecommendStore.getState().drawer;
    expect(drawer.open).toBe(true);
    expect(drawer.cardId).toBe(clickedCardId);
  });

  it('段落二 banner：文案“匹配到了与你的需求相似的画像资产”存在', () => {
    const sections: RecommendSection[] = [
      {
        section_id: 'paragraph_2',
        emoji: '📌',
        title: '匹配到了与你的需求相似的画像资产',
        subtitle: '将人群与动作组合，获得更高整体增益',
        bg_style: 'accent',
        slots: [
          {
            kind: 'card_list',
            cards: [makeCard({ id: 'p2_s1', title: 'p2_single_1', confidence: 0.7, healthStatus: 'warning' })],
            adapt: { type: 'recommend_cards', sourceKind: 'similarity_mock', sourceId: 'p2_s1' },
          },
          {
            kind: 'combo_group',
            groups: [
              {
                id: 'p2_combo',
                kind: 'cohort',
                title: '相似组合（可调整）',
                comboTitle: 'combo_p2',
                combinedLift: 0.12,
                cards: [
                  makeCard({ id: 'p2_c1', title: 'p2_combo_1', confidence: 0.7, healthStatus: 'healthy' }),
                  makeCard({ id: 'p2_c2', title: 'p2_combo_2', confidence: 0.7, healthStatus: 'healthy' }),
                ],
              },
            ],
            adapt: { type: 'recommend_group', sourceKind: 'mock', sourceId: 'p2_combo' },
          },
        ],
      },
      {
        section_id: 'paragraph_3',
        emoji: '🧭',
        title: '都不符合你的诉求？',
        subtitle: '可能是资产尚未入驻市集，或诉求过于定制',
        bg_style: 'muted',
        slots: [
          {
            kind: 'fallback_cta',
            cta: {
              primary: { text: '去提需更多画像标签建设', action: 'go_report' },
              secondary: { text: '联系资产 Owner', action: 'contact_owner' },
            },
          },
        ],
      },
    ];
    useRecommendStore.setState({ sections, groups: [{ id: 'fallback', kind: 'fallback', title: '都不符合你的诉求？', cards: [] }] });

    render(<RecommendGroupSection />);

    expect(screen.getByText('匹配到了与你的需求相似的画像资产')).toBeInTheDocument();
  });

  it('段落一/二卡位数量为 2+1：各 2 张单卡标题 + 各 1 个组合容器', () => {
    const groups: RecommendGroup[] = [
      {
        id: 'ai',
        kind: 'ai',
        title: '推荐组 1 · AI 推荐',
        cards: [
          makeCard({ id: 'r1', title: 'p1_single_1', confidence: 0.92, healthStatus: 'healthy' }),
          makeCard({ id: 'r2', title: 'p1_single_2', confidence: 0.91, healthStatus: 'healthy' }),
          makeCard({ id: 'r3', title: 'unused_1', confidence: 0.7, healthStatus: 'warning' }),
        ],
      },
      {
        id: 'cohort_ready',
        kind: 'cohort',
        title: 'ready_cohort',
        comboTitle: 'combo_p1',
        combinedLift: 0.18,
        cards: [
          makeCard({ id: 'cr1', title: 'p1_combo_1', confidence: 0.86, healthStatus: 'healthy' }),
          makeCard({ id: 'cr2', title: 'p1_combo_2', confidence: 0.86, healthStatus: 'healthy' }),
        ],
      },
      {
        id: 'cohort_similar',
        kind: 'cohort',
        title: 'similar_cohort',
        comboTitle: 'combo_p2',
        combinedLift: 0.12,
        cards: [
          makeCard({ id: 'cs1', title: 'p2_combo_1', confidence: 0.7, healthStatus: 'warning' }),
          makeCard({ id: 'cs2', title: 'p2_combo_2', confidence: 0.7, healthStatus: 'healthy' }),
        ],
      },
      { id: 'fallback', kind: 'fallback', title: '都不符合你的诉求？', cards: [] },
    ];

    const sections: RecommendSection[] = [
      {
        section_id: 'paragraph_1',
        emoji: '🤖',
        title: '以下画像资产高度匹配，可以直接配置使用',
        subtitle: '基于你的诉求生成的可执行建议',
        bg_style: 'plain',
        slots: [
          {
            kind: 'card_list',
            cards: [
              makeCard({ id: 'r1', title: 'p1_single_1', confidence: 0.92, healthStatus: 'healthy' }),
              makeCard({ id: 'r2', title: 'p1_single_2', confidence: 0.91, healthStatus: 'healthy' }),
            ],
            adapt: { type: 'recommend_cards', sourceKind: 'ready_ai', sourceId: 'ai' },
          },
          {
            kind: 'combo_group',
            groups: [
              {
                id: 'cohort_ready',
                kind: 'cohort',
                title: 'ready_cohort',
                comboTitle: 'combo_p1',
                combinedLift: 0.18,
                cards: [
                  makeCard({ id: 'cr1', title: 'p1_combo_1', confidence: 0.86, healthStatus: 'healthy' }),
                  makeCard({ id: 'cr2', title: 'p1_combo_2', confidence: 0.86, healthStatus: 'healthy' }),
                ],
              },
            ],
            adapt: { type: 'recommend_group', sourceKind: 'ready_cohort', sourceId: 'cohort_ready' },
          },
        ],
      },
      {
        section_id: 'paragraph_2',
        emoji: '📌',
        title: '匹配到了与你的需求相似的画像资产',
        subtitle: '将人群与动作组合，获得更高整体增益',
        bg_style: 'accent',
        slots: [
          {
            kind: 'card_list',
            cards: [makeCard({ id: 'p2_s1', title: 'p2_single_1', confidence: 0.7, healthStatus: 'warning' })],
            adapt: { type: 'recommend_cards', sourceKind: 'similarity_pool', sourceId: 'p2_s1' },
          },
          {
            kind: 'card_list',
            cards: [makeCard({ id: 'p2_s2', title: 'p2_single_2', confidence: 0.68, healthStatus: 'healthy' })],
            adapt: { type: 'recommend_cards', sourceKind: 'similarity_pool', sourceId: 'p2_s2' },
          },
          {
            kind: 'combo_group',
            groups: [
              {
                id: 'cohort_similar',
                kind: 'cohort',
                title: 'similar_cohort',
                comboTitle: 'combo_p2',
                combinedLift: 0.12,
                cards: [
                  makeCard({ id: 'cs1', title: 'p2_combo_1', confidence: 0.7, healthStatus: 'warning' }),
                  makeCard({ id: 'cs2', title: 'p2_combo_2', confidence: 0.7, healthStatus: 'healthy' }),
                ],
              },
            ],
            adapt: { type: 'recommend_group', sourceKind: 'cohort_reuse', sourceId: 'cohort_similar' },
          },
        ],
      },
      {
        section_id: 'paragraph_3',
        emoji: '🧭',
        title: '都不符合你的诉求？',
        subtitle: '可能是资产尚未入驻市集，或诉求过于定制',
        bg_style: 'muted',
        slots: [
          {
            kind: 'fallback_cta',
            cta: {
              primary: { text: '去提需更多画像标签建设', action: 'go_report' },
              secondary: { text: '联系资产 Owner', action: 'contact_owner' },
            },
          },
        ],
      },
    ];

    useRecommendStore.setState({ groups, sections });

    render(<RecommendGroupSection />);

    // paragraph_1：2 张单卡标题
    expect(screen.getByText('p1_single_1')).toBeInTheDocument();
    expect(screen.getByText('p1_single_2')).toBeInTheDocument();
    // paragraph_2：2 张单卡标题
    expect(screen.getByText('p2_single_1')).toBeInTheDocument();
    expect(screen.getByText('p2_single_2')).toBeInTheDocument();

    // 两段各 1 个组合容器：通过“预计组合增益 GMV”出现次数判断
    expect(screen.getAllByText(/预计组合增益\s*GMV/).length).toBe(2);
  });
});
