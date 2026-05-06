import { create } from 'zustand';
import type { AppView, UserPermission, UserRole, ViewStateSnapshot } from '../types';
import { normalizeLegacyView } from '../lib/view';

export type ConsumerSubRole = 'business' | 'algorithm';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  avatar: string;
  teamId: string;
  team: string;
};

const VIEW_STORAGE_KEY = 'cp_role_v2';
const LEGACY_VIEW_STORAGE_KEYS = ['cp_app_view'];
const USER_ROLE_STORAGE_KEY = 'cp_user_role';

function readInitialView(): AppView {
  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
    const nextView = normalizeLegacyView(raw);
    if (nextView) return nextView;

    for (const legacyKey of LEGACY_VIEW_STORAGE_KEYS) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      const legacyView = normalizeLegacyView(legacyValue);
      if (legacyView) return legacyView;
    }
  } catch {
    // ignore storage errors (private mode / disabled storage)
  }
  return 'consumer';
}

function readInitialUserRole(): UserRole {
  try {
    const raw = window.localStorage.getItem(USER_ROLE_STORAGE_KEY);
    if (
      raw === 'consumer' ||
      raw === 'producer' ||
      raw === 'producer_admin' ||
      raw === 'platform_admin'
    ) {
      return raw;
    }
  } catch {
    // ignore storage errors (private mode / disabled storage)
  }
  return 'platform_admin';
}

function persistView(next: AppView) {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  } catch {
    // ignore storage errors (private mode / disabled storage)
  }
}

function persistUserRole(next: UserRole) {
  try {
    window.localStorage.setItem(USER_ROLE_STORAGE_KEY, next);
  } catch {
    // ignore storage errors (private mode / disabled storage)
  }
}

export interface GlobalState {
  userRole: UserRole;
  currentView: AppView;
  availableViews: AppView[];
  defaultView: AppView;
  permissionsLoaded: boolean;
  userPermission: UserPermission | null;
  consumerSubRole: ConsumerSubRole;
  currentUser: CurrentUser;
  breadcrumb: BreadcrumbItem[];
  sideNavCollapsed: boolean;

  setUserPermission: (permission: UserPermission) => void;
  setViewState: (snapshot: Partial<ViewStateSnapshot>) => void;
  setCurrentView: (view: AppView) => void;
  setConsumerSubRole: (consumerSubRole: ConsumerSubRole) => void;
  setCurrentUser: (currentUser: CurrentUser) => void;
  setBreadcrumb: (items: BreadcrumbItem[]) => void;
  clearBreadcrumb: () => void;
  setSideNavCollapsed: (collapsed: boolean) => void;
  toggleSideNav: () => void;
}

const defaultUser: CurrentUser = {
  id: 'user_platform_admin_001',
  name: '张三',
  avatar: '',
  teamId: 'team_platform',
  team: 'Cross-Profile',
};

export const useGlobalState = create<GlobalState>((set) => ({
  userRole: readInitialUserRole(),
  currentView: readInitialView(),
  availableViews: ['consumer'],
  defaultView: 'consumer',
  permissionsLoaded: false,
  userPermission: null,
  consumerSubRole: 'business',
  currentUser: defaultUser,
  breadcrumb: [],
  sideNavCollapsed: true,

  setUserPermission: (permission) => {
    persistUserRole(permission.role);
    set((state) => {
      const nextCurrentView = permission.availableViews.includes(state.currentView) ? state.currentView : permission.defaultView;
      persistView(nextCurrentView);
      return {
        userRole: permission.role,
        currentView: nextCurrentView,
        availableViews: [...permission.availableViews],
        defaultView: permission.defaultView,
        permissionsLoaded: true,
        userPermission: permission,
        currentUser: {
          id: permission.userId,
          name: permission.userName,
          avatar: '',
          teamId: permission.teamId,
          team: permission.teamName,
        },
      };
    });
  },
  setViewState: (snapshot) => {
    set((state) => {
      const nextView = snapshot.currentView ?? state.currentView;
      persistView(nextView);
      return {
        userRole: snapshot.userRole ?? state.userRole,
        currentView: nextView,
        availableViews: snapshot.availableViews ?? state.availableViews,
        defaultView: snapshot.defaultView ?? state.defaultView,
      };
    });
  },
  setCurrentView: (currentView) => {
    persistView(currentView);
    set({ currentView });
  },
  setConsumerSubRole: (consumerSubRole) => set({ consumerSubRole }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setBreadcrumb: (items) => set({ breadcrumb: items.slice(-3) }),
  clearBreadcrumb: () => set({ breadcrumb: [] }),
  setSideNavCollapsed: (sideNavCollapsed) => set({ sideNavCollapsed }),
  toggleSideNav: () => set((state) => ({ sideNavCollapsed: !state.sideNavCollapsed })),
}));
