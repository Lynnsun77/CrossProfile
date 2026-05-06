import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RECOMMEND_CARDS } from '../scripts/lark-merchant-insight.script';
import { hotpotBundle, hotpotGaps, hotpotRequirement } from '../mocks/hotpot_data';
import { useRecommendStore } from './useRecommendStore';

describe('useRecommendStore', () => {
  beforeEach(() => {
    vi.useRealTimers();
    useRecommendStore.getState().reset();
  });

  it('startSession(url, title) 会重置上一次会话结果并进入 parse', () => {
    const previousSessionId = useRecommendStore.getState().sessionId;

    useRecommendStore.setState({
      phase: 'done',
      step: 'result',
      completedSteps: ['entry', 'parsing', 'recommending', 'result'],
      requirement: hotpotRequirement,
      recommends: DEFAULT_RECOMMEND_CARDS,
      actions: DEFAULT_RECOMMEND_CARDS,
      featureBundle: hotpotBundle,
      gaps: hotpotGaps,
      tickets: [{ id: 'ticket_old', gapId: 'g_01', createdAtMs: 1 }],
      starred: ['a_01'],
      thinking: [
        {
          id: 'parse-1',
          t: 1000,
          phase: 'parse',
          node: '读取飞书文档',
          text: '旧会话',
          status: 'done',
        },
      ],
      thinkingTrace: [
        {
          id: 'parse-1',
          label: '读取飞书文档',
          description: '旧会话',
          status: 'done',
          timestampMs: 1000,
        },
      ],
    });

    useRecommendStore.getState().startSession('https://bytedance.larkoffice.com/wiki/new-doc', '新需求单');

    const state = useRecommendStore.getState();
    expect(state.sessionId).not.toBe(previousSessionId);
    expect(state.phase).toBe('parse');
    expect(state.step).toBe('parsing');
    expect(state.docUrl).toBe('https://bytedance.larkoffice.com/wiki/new-doc');
    expect(state.docTitle).toBe('新需求单');
    expect(state.requirement).toBeNull();
    expect(state.recommends).toEqual([]);
    expect(state.actions).toEqual([]);
    expect(state.featureBundle).toBeNull();
    expect(state.gaps).toEqual([]);
    expect(state.tickets).toEqual([]);
    expect(state.starred).toEqual([]);
    expect(state.thinking).toEqual([]);
    expect(state.thinkingTrace).toEqual([]);
  });

  it('submitTicket(gapId) 会追加带时间戳的工单记录', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T12:00:00.000Z'));

    useRecommendStore.getState().submitTicket('g_01');
    useRecommendStore.getState().submitTicket('g_02');

    const { tickets } = useRecommendStore.getState();
    expect(tickets).toHaveLength(2);
    expect(tickets[0].gapId).toBe('g_01');
    expect(tickets[1].gapId).toBe('g_02');
    expect(tickets[0].createdAtMs).toBe(new Date('2026-04-27T12:00:00.000Z').getTime());
    expect(tickets[1].createdAtMs).toBe(new Date('2026-04-27T12:00:00.000Z').getTime());
  });
});
