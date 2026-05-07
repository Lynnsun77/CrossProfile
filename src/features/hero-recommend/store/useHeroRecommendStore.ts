import { create } from 'zustand';
import mockTagsRaw from '../mock/mockTags.json';
import {
  buildSummaryText,
  generateMockRecommendations,
  parseIntent,
} from '../scripts';
import type {
  AnalysisPhase,
  GroupedRecommendations,
  IntentParsedResult,
  MockTags,
} from '../types';

const mockTags = mockTagsRaw as MockTags;

interface HeroDraft {
  goalIds: string[];
  sceneIds: string[];
  text: string;
}

export interface HeroRecommendState {
  heroDraft: HeroDraft;
  textLocked: boolean;
  analysisPhase: AnalysisPhase;
  analysisStep: 0 | 1 | 2 | 3 | 4;
  intentParsed: IntentParsedResult | null;
  grouped: GroupedRecommendations | null;
  summaryText: string;
  candidateIds: string[];
  detailCardId: string | null;
  _timers: number[];
}

export interface HeroRecommendActions {
  toggleGoal: (id: string) => void;
  toggleScene: (id: string) => void;
  applyExampleChip: (text: string) => void;
  updateHeroText: (text: string) => void;
  submitHeroIntent: (opts?: { forceError?: boolean }) => void;
  retryHero: () => void;
  addCandidate: (cardId: string) => void;
  removeCandidate: (cardId: string) => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  _clearTimers: () => void;
}

type Store = HeroRecommendState & HeroRecommendActions;

function buildTextFromTags(goalIds: string[], sceneIds: string[]): string {
  const goal = goalIds.length > 0 ? mockTags.goals.find((g) => g.id === goalIds[0]) : null;
  const scene = sceneIds.length > 0 ? mockTags.scenes.find((s) => s.id === sceneIds[0]) : null;

  if (goal && scene) {
    return `我想在${scene.phrase}${goal.phrase}`;
  }
  if (goal) {
    return `我想${goal.phrase}`;
  }
  if (scene) {
    return `我想在${scene.phrase}做相关运营`;
  }
  return '';
}

// 初始化默认推荐（空输入兜底）
const initialParsed = parseIntent({});
const initialGrouped = generateMockRecommendations(initialParsed);

export const useHeroRecommendStore = create<Store>((set, get) => ({
  heroDraft: { goalIds: [], sceneIds: [], text: '' },
  textLocked: false,
  analysisPhase: 'idle',
  analysisStep: 0,
  intentParsed: null,
  grouped: initialGrouped,
  summaryText: '',
  candidateIds: [],
  detailCardId: null,
  _timers: [],

  toggleGoal: (id) => {
    const { heroDraft, textLocked } = get();
    const exists = heroDraft.goalIds.includes(id);
    const nextGoalIds = exists ? heroDraft.goalIds.filter((x) => x !== id) : [...heroDraft.goalIds, id];
    const nextText = textLocked ? heroDraft.text : buildTextFromTags(nextGoalIds, heroDraft.sceneIds);
    set({
      heroDraft: { ...heroDraft, goalIds: nextGoalIds, text: nextText },
    });
  },

  toggleScene: (id) => {
    const { heroDraft, textLocked } = get();
    const exists = heroDraft.sceneIds.includes(id);
    const nextSceneIds = exists ? heroDraft.sceneIds.filter((x) => x !== id) : [...heroDraft.sceneIds, id];
    const nextText = textLocked ? heroDraft.text : buildTextFromTags(heroDraft.goalIds, nextSceneIds);
    set({
      heroDraft: { ...heroDraft, sceneIds: nextSceneIds, text: nextText },
    });
  },

  applyExampleChip: (text) => {
    const { heroDraft } = get();
    set({
      heroDraft: { ...heroDraft, text },
      textLocked: false,
    });
  },

  updateHeroText: (text) => {
    const { heroDraft } = get();
    set({
      heroDraft: { ...heroDraft, text },
      textLocked: true,
    });
  },

  _clearTimers: () => {
    const { _timers } = get();
    _timers.forEach((t) => window.clearTimeout(t));
    set({ _timers: [] });
  },

  submitHeroIntent: (opts) => {
    const { heroDraft, _clearTimers } = get();
    _clearTimers();

    set({
      analysisPhase: 'analyzing',
      analysisStep: 0,
      intentParsed: null,
      summaryText: '',
    });

    const timers: number[] = [];
    const stepDelay = 450;

    for (let step = 1; step <= 4; step++) {
      const t = window.setTimeout(() => {
        set({ analysisStep: step as 0 | 1 | 2 | 3 | 4 });
      }, stepDelay * step);
      timers.push(t);
    }

    const finalTimer = window.setTimeout(() => {
      try {
        if (opts?.forceError) {
          throw new Error('forced error');
        }
        const parsed = parseIntent({
          text: heroDraft.text,
          goalIds: heroDraft.goalIds,
          sceneIds: heroDraft.sceneIds,
        });
        const grouped = generateMockRecommendations(parsed);
        const summaryText = buildSummaryText(parsed, grouped);
        const total = grouped.priority.length + grouped.expandable.length + grouped.similar.length;
        set({
          intentParsed: parsed,
          grouped,
          summaryText,
          analysisPhase: total === 0 ? 'empty' : 'ready',
        });
      } catch {
        set({ analysisPhase: 'error' });
      }
    }, stepDelay * 4 + 50);
    timers.push(finalTimer);

    set({ _timers: timers });
  },

  retryHero: () => {
    const { _clearTimers, submitHeroIntent } = get();
    _clearTimers();
    set({ analysisPhase: 'idle', analysisStep: 0 });
    // 稍后重新提交
    const t = window.setTimeout(() => {
      submitHeroIntent();
    }, 50);
    set({ _timers: [t] });
  },

  addCandidate: (cardId) => {
    const { candidateIds } = get();
    if (candidateIds.includes(cardId)) return;
    set({ candidateIds: [...candidateIds, cardId] });
  },

  removeCandidate: (cardId) => {
    const { candidateIds } = get();
    set({ candidateIds: candidateIds.filter((x) => x !== cardId) });
  },

  openDetail: (id) => set({ detailCardId: id }),
  closeDetail: () => set({ detailCardId: null }),
}));
