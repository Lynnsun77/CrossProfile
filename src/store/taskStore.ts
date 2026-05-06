import { create } from 'zustand';
import type { DispatchTask } from '../types';

interface TaskStore {
  tasks: DispatchTask[];
  addTask: (task: DispatchTask) => void;
  updateTask: (id: string, updates: Partial<DispatchTask>) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  }))
}));
