// Pure, React-free script scheduler.
// Given a script + phase + dispatch, schedule frames via setTimeout and return a cancel().
//
// Keeping this module free of React / store imports lets us:
//   (1) Unit-test timing logic without mounting components.
//   (2) Swap the transport later (real SSE, WebSocket, ...) without touching the hook.

import type { AgentScript, ScriptEvent, ScriptPhase } from '../features/recommend/scripts/types';
import type { AgentEvent } from '../features/recommend/types';

export type Dispatch = (event: AgentEvent) => void;

export interface ScaleBounds {
  min: number;
  max: number;
}

const DEFAULT_BOUNDS: ScaleBounds = { min: 0.7, max: 2.5 };

export function pickPhaseFrames(script: AgentScript, phase: ScriptPhase): ScriptEvent[] {
  return script.timeline.filter((f) => f.phase === phase);
}

/**
 * Compute a uniform scale so a full-script (all phases) replay finishes near `targetMs`.
 * Scale is clamped to keep the pace from feeling too snappy or too sluggish.
 */
export function computeScale(
  script: AgentScript,
  targetMs: number,
  bounds: ScaleBounds = DEFAULT_BOUNDS,
): number {
  const total = script.timeline.reduce((sum, f) => sum + f.delayMs, 0);
  if (total <= 0) return 1;
  const raw = targetMs / total;
  return Math.max(bounds.min, Math.min(bounds.max, raw));
}

export interface RunScriptOptions {
  scale?: number; // if omitted, 1
}

/**
 * Schedule a single phase's frames. Returns a cancel() that clears all pending timers.
 * Frames use cumulative delayMs inside a phase (first frame's delayMs is relative to "now").
 */
export function runScript(
  script: AgentScript,
  phase: ScriptPhase,
  dispatch: Dispatch,
  options: RunScriptOptions = {},
): () => void {
  const scale = options.scale ?? 1;
  const frames = pickPhaseFrames(script, phase);
  const timers: ReturnType<typeof setTimeout>[] = [];

  let acc = 0;
  frames.forEach(({ delayMs, event }) => {
    acc += Math.round(delayMs * scale);
    const t = setTimeout(() => dispatch(event), acc);
    timers.push(t);
  });

  return () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
  };
}
