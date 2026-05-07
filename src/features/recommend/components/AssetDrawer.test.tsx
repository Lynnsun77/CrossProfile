import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetDrawer, buildDrawerBreadcrumb, findParagraphMetaByCardId } from './AssetDrawer';
import { DeployConfigModal } from './DeployConfigModal';
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
    consumers: partial.consumers ?? ['生服增长', 'CRM 团队'],
    healthStatus: partial.healthStatus ?? 'healthy',
    audience_narrative: partial.audience_narrative ?? '该人群适合用于会员复购提效。',
  };
}

describe('AssetDrawer', () => {
  beforeEach(() => {
    useRecommendStore.getState().reset();
  });

  it('可根据段落与卡槽生成面包屑', () => {
    const sections: RecommendSection[] = [
      {
        section_id: 'paragraph_1',
        emoji: '🤖',
        title: '以下画像资产高度匹配，可以直接配置使用',
        bg_style: 'plain',
        slots: [
          {
            kind: 'card_list',
            cards: [makeCard({ id: 'card_1', title: '会员高复购人群', confidence: 0.92 })],
          },
        ],
      },
    ];

    const paragraphMeta = findParagraphMetaByCardId(sections, 'card_1');
    expect(paragraphMeta).toEqual({ paragraphKind: 'ready', slotKind: 'card_list' });
    expect(buildDrawerBreadcrumb('会员高复购人群', paragraphMeta)).toBe(
      '智能推荐 › ✨ 可直接复用 › 推荐组 1 · AI 推荐 › 会员高复购人群',
    );
  });

  it('打开抽屉时展示段落面包屑并支持展开订阅明细', () => {
    const card = makeCard({ id: 'card_2', title: '高价值会员包', confidence: 0.88 });
    const groups: RecommendGroup[] = [
      { id: 'ai', kind: 'ai', title: '推荐组 1 · AI 推荐', cards: [card] },
      { id: 'fallback', kind: 'fallback', title: '都不符合你的诉求？', cards: [] },
    ];
    const sections: RecommendSection[] = [
      {
        section_id: 'paragraph_2',
        emoji: '📌',
        title: '匹配到了与你的需求相似的画像资产',
        subtitle: '从相似场景中挑选的候选资产，可结合目标做调整',
        bg_style: 'accent',
        slots: [
          {
            kind: 'combo_group',
            groups: [
              {
                id: 'combo_1',
                kind: 'cohort',
                title: '相似组合（可调整）',
                cards: [card, makeCard({ id: 'card_3', title: '拉新补充包', confidence: 0.73 })],
              },
            ],
          },
        ],
      },
    ];

    useRecommendStore.setState({
      groups,
      sections,
      drawer: { open: true, cardId: 'card_2' },
    });

    render(<AssetDrawer />);

    expect(screen.getByText('智能推荐 › 🧩 可加工后使用 › 推荐组 4 · 相似组合 › 高价值会员包')).toBeInTheDocument();
    expect(screen.getByText('同类用户订阅行为')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '查看订阅明细 ▾' }));

    expect(screen.getByText('生服增长 ·')).toBeInTheDocument();
    expect(screen.getByText('推荐算法 ·')).toBeInTheDocument();
  });

  it('展示 6 个决策模块锚点并支持点击联动', () => {
    const scrollIntoViewSpy = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    const card = makeCard({ id: 'card_anchor', title: '锚点测试卡', confidence: 0.88 });
    useRecommendStore.setState({
      groups: [{ id: 'ai', kind: 'ai', title: '推荐组 1 · AI 推荐', cards: [card] }],
      sections: [
        {
          section_id: 'paragraph_1',
          emoji: '🤖',
          title: '以下画像资产高度匹配，可以直接配置使用',
          bg_style: 'plain',
          slots: [{ kind: 'card_list', cards: [card] }],
        },
      ],
      drawer: { open: true, cardId: 'card_anchor' },
    });

    render(<AssetDrawer />);

    const anchorNav = screen.getByRole('navigation', { name: '决策抽屉锚点' });
    expect(anchorNav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '人群构成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '订阅行为' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '血缘透视' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '基准线对照' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '订阅影响' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '血缘透视' }));

    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '血缘透视' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('离线资产禁用去投放按钮', () => {
    const offlineCard = makeCard({ id: 'card_4', title: '已下线资产', confidence: 0.55, healthStatus: 'offline' });
    useRecommendStore.setState({
      groups: [{ id: 'ai', kind: 'ai', title: '推荐组 1 · AI 推荐', cards: [offlineCard] }],
      sections: [],
      drawer: { open: true, cardId: 'card_4' },
    });

    render(<AssetDrawer />);

    expect(screen.getByRole('button', { name: '资产已下线' })).toBeDisabled();
  });

  it('打开 ready 配置后保留详情抽屉，并在再次打开时恢复上次填写选项', () => {
    const card = makeCard({ id: 'card_deploy', title: '投放测试卡', confidence: 0.93 });
    useRecommendStore.setState({
      groups: [{ id: 'ai', kind: 'ai', title: '推荐组 1 · AI 推荐', cards: [card] }],
      sections: [
        {
          section_id: 'paragraph_1',
          emoji: '🤖',
          title: '以下画像资产高度匹配，可以直接配置使用',
          bg_style: 'plain',
          slots: [{ kind: 'card_list', cards: [card] }],
        },
      ],
      drawer: { open: true, cardId: 'card_deploy' },
    });

    render(
      <>
        <AssetDrawer />
        <DeployConfigModal />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: '去投放' }));
    expect(screen.getByRole('dialog', { name: '一键配置' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '投放测试卡' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '生服 DMP（LDMP）' } });
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: 'https://example.com/deploy' } });
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(screen.queryByRole('dialog', { name: '一键配置' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '投放测试卡' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '去投放' }));
    expect(screen.getByRole('combobox')).toHaveValue('生服 DMP（LDMP）');
    expect(screen.getByPlaceholderText('https://...')).toHaveValue('https://example.com/deploy');

    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(screen.queryByRole('dialog', { name: '一键配置' })).not.toBeInTheDocument();
    expect(screen.getByText('投放已提交')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '投放测试卡' })).toBeInTheDocument();
    expect(useRecommendStore.getState().drawer).toEqual({ open: true, cardId: 'card_deploy' });
  });
});
