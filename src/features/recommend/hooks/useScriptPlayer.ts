import { useEffect, useRef } from 'react';
import { useRecommendStore } from './useRecommendStore';
import { scriptSteps } from '../scripts/lark-merchant-insight.script';
import type { RecommendPhase } from '../types';

let GLOBAL_CANCELS: Array<() => void> = [];
let GLOBAL_PLAYED_PHASES = new Set<string>();

function clearGlobalTimers() {
  GLOBAL_CANCELS.forEach((cancel) => cancel());
  GLOBAL_CANCELS = [];
}

function resetPlayerGlobals() {
  clearGlobalTimers();
  GLOBAL_PLAYED_PHASES = new Set();
}

function isPlayablePhase(phase: RecommendPhase): phase is Extract<RecommendPhase, 'parse' | 'recommend' | 'gap'> {
  return phase === 'parse' || phase === 'recommend' || phase === 'gap';
}

export function __resetScriptPlayerForTests() {
  resetPlayerGlobals();
}

type UseScriptPlayerOptions = {
  manualGateAfterParse?: boolean;
  timeScale?: number;
};

function resolveOptions(options?: string | UseScriptPlayerOptions): Required<UseScriptPlayerOptions> {
  return {
    manualGateAfterParse: typeof options === 'string' ? false : options?.manualGateAfterParse ?? false,
    timeScale: typeof options === 'string' ? 1 : options?.timeScale ?? 1,
  };
}

export function useScriptPlayer(options?: string | UseScriptPlayerOptions) {
  const phase = useRecommendStore((s) => s.phase);
  const sessionId = useRecommendStore((s) => s.sessionId);
  const setManualGateAfterParse = useRecommendStore((s) => s.setManualGateAfterParse);
  const pushChainNode = useRecommendStore((s) => s.pushChainNode);
  const completeThinking = useRecommendStore((s) => s.completeThinking);
  const resolvedOptions = resolveOptions(options);
  const lastSessionIdRef = useRef('');
  const timersRef = useRef<number[]>([]);

  const clearAll = () => {
    resetPlayerGlobals();
  };

  useEffect(() => {
    if (lastSessionIdRef.current === sessionId) return;
    lastSessionIdRef.current = sessionId;
    resetPlayerGlobals();
  }, [sessionId]);

  useEffect(() => {
    setManualGateAfterParse(resolvedOptions.manualGateAfterParse);
  }, [resolvedOptions.manualGateAfterParse, setManualGateAfterParse]);

  useEffect(() => {
    if (!isPlayablePhase(phase)) {
      if (phase === 'idle') {
        resetPlayerGlobals();
      }
      return;
    }

    const playKey = `${sessionId}:${phase}`;
    if (GLOBAL_PLAYED_PHASES.has(playKey)) {
      return;
    }
    GLOBAL_PLAYED_PHASES.add(playKey);

    const step = scriptSteps.find((item) => item.phase === phase);
    if (!step) return;
    const orderBase = scriptSteps
      .filter((item) => item.phase !== phase)
      .reduce((acc, item) => {
        if (item.phase === 'parse' && phase !== 'parse') return acc + item.thinking.length;
        if (item.phase === 'recommend' && phase === 'gap') return acc + item.thinking.length;
        return acc;
      }, 0);

    step.thinking.forEach((event, index) => {
      const id = window.setTimeout(() => {
        const state = useRecommendStore.getState();
        if (state.sessionId !== sessionId || state.phase !== phase) return;
        state.dispatch({ type: 'PUSH_THINKING', payload: event });
        pushChainNode({
          id: `${phase}-${index + 1}`,
          order: orderBase + index + 1,
          title: event.node,
          desc: event.text,
          status: 'running',
        });
      }, event.t * resolvedOptions.timeScale);
      timersRef.current.push(id);
      GLOBAL_CANCELS.push(() => window.clearTimeout(id));
    });

    const lastT = (step.thinking[step.thinking.length - 1]?.t ?? 0) * resolvedOptions.timeScale;
    const exitId = window.setTimeout(() => {
      const state = useRecommendStore.getState();
      if (state.sessionId !== sessionId || state.phase !== phase) return;
      step.onExit?.(state.dispatch);
      step.thinking.forEach((event, index) => {
        pushChainNode({
          id: `${phase}-${index + 1}`,
          order: orderBase + index + 1,
          title: event.node,
          desc: event.text,
          status: 'done',
        });
      });
      if (phase === 'parse' && resolvedOptions.manualGateAfterParse) return;
      if (phase === 'parse') state.dispatch({ type: 'ENTER_PHASE', payload: 'recommend' });
      else if (phase === 'recommend') state.dispatch({ type: 'ENTER_PHASE', payload: 'gap' });
      else if (phase === 'gap') completeThinking();
    }, lastT + 600);
    timersRef.current.push(exitId);
    GLOBAL_CANCELS.push(() => window.clearTimeout(exitId));

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [completeThinking, phase, pushChainNode, resolvedOptions.manualGateAfterParse, resolvedOptions.timeScale, sessionId]);

  useEffect(() => clearAll, []);

  return { cancel: clearAll };
}
