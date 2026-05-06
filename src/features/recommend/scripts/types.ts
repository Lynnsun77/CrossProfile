import type { AgentEvent, RecommendInput } from '../types';

export type ScriptPhase = 'parsing' | 'recommending';

export interface ScriptEvent {
  phase: ScriptPhase;
  delayMs: number; // relative to previous event in the same phase
  event: AgentEvent;
}

export interface AgentScript {
  id: string;
  name?: string;
  matcher?: (input: Pick<RecommendInput, 'text' | 'docUrl'>) => boolean;
  timeline: ScriptEvent[];
}
