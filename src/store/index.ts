import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StrategyScene = 'local' | 'ecom' | 'cross';

export interface AgentContext {
  goal: string | null; // 业务目标(展示文案)
  scene: StrategyScene; // 策略场景(默认 cross)
  setGoal: (goal: string | null) => void;
  setScene: (scene: StrategyScene) => void;
}

export const useAgentCtxStore = create<AgentContext>()(
  persist(
    (set) => ({
      goal: null,
      scene: 'cross',
      setGoal: (goal) => set({ goal }),
      setScene: (scene) => set({ scene }),
    }),
    { name: 'cross-profile-agent-ctx' }
  )
);

export {
  useGlobalState,
  type BreadcrumbItem,
  type ConsumerSubRole,
  type CurrentUser,
} from './globalState';

export type { AppView } from '../types';
