import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role as AppRole } from '../types';

interface RoleStore {
  role: AppRole;
  setRole: (role: AppRole) => void;
}

const defaultRole: AppRole = 'business';

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      role: defaultRole,
      setRole: (role) => set({ role }),
    }),
    {
      name: 'cross-profile-role',
    }
  )
);
