import { matchPath } from 'react-router-dom';
import navigationConfig from '../config/navigation.json';
import { inferStage } from '../components/nav/nav.theme';
import type { NavCollapsible, NavGroupDef, NavGroupItem, NavLeaf, NavStage, NavSubRole } from '../components/nav/nav.types';
import { isNavCollapsible, isNavLeaf, isNavSectionTitle } from '../components/nav/nav.types';
import type { AppView } from '../types';

type NavConfigLeaf = {
  type?: 'leaf';
  label: string;
  path: string;
  query?: Record<string, string>;
  roles?: NavSubRole[];
  subRole?: NavSubRole[];
  dynamic?: boolean;
  hiddenInNav?: boolean;
  activeParentPath?: string;
  badgeKey?: NavLeaf['badgeKey'];
  recentDynamic?: NavLeaf['recentDynamic'];
};

type NavConfigSectionTitle = {
  type: 'sectionTitle';
  label: string;
  roles?: NavSubRole[];
  subRole?: NavSubRole[];
};

type NavConfigCollapsible = {
  type: 'collapsible';
  label: string;
  roles?: NavSubRole[];
  subRole?: NavSubRole[];
  children: NavConfigLeaf[];
};

type NavConfigItem = NavConfigLeaf | NavConfigSectionTitle | NavConfigCollapsible;

type NavConfigGroup = {
  group: string;
  stage?: NavStage;
  items: NavConfigItem[];
};

type NavConfigView = {
  label: string;
  subRoles?: Array<{ key: NavSubRole; label: string }>;
  nav: NavConfigGroup[];
};

type UserMenuItem = {
  label?: string;
  path?: string;
  query?: Record<string, string>;
  roles?: string[];
  dynamic?: boolean;
  action?: 'toggleRole' | 'logout';
  badge?: {
    source: string;
    style: 'number' | 'dot-number' | 'number-new';
    severity?: 'warn';
  };
  variant?: 'danger';
};

type UserMenuView = {
  identity: {
    showSubRoleSwitcher: boolean;
    subRoles?: Array<'business' | 'algorithm'>;
  };
  groups: Array<{
    label: string;
    items: UserMenuItem[];
  }>;
};

type NavigationConfigShape = {
  version: string;
  views: {
    consumer: NavConfigView;
    producer: NavConfigView;
  };
  userMenu: {
    consumer: UserMenuView;
    producer: UserMenuView;
    common: {
      groups: Array<{
        label: string;
        items: UserMenuItem[];
      }>;
    };
  };
  excludedFromNav?: string[];
};

export type NavGroup = NavGroupDef;
export type UserMenuConfig = UserMenuView;
export type UserMenuCommonConfig = NavigationConfigShape['userMenu']['common'];

type NavOptions = {
  consumerSubRole?: NavSubRole;
  includeHidden?: boolean;
};

type NavMatchRecord = {
  id: string;
  path: string;
  parentId: string | null;
  visible: boolean;
};

function normalizeNavView(view: AppView): 'consumer' | 'producer' | null {
  if (view === 'consumer') return 'consumer';
  if (view === 'producer') return 'producer';
  return null;
}

function getNavConfigForView(view: AppView) {
  const normalizedView = normalizeNavView(view);
  if (!normalizedView) return null;
  return (navigationConfig as NavigationConfigShape).views[normalizedView];
}

function getNavGroupsForView(view: AppView) {
  return getNavConfigForView(view)?.nav ?? [];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toQueryString(query?: Record<string, string>) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value != null && value !== '') params.set(key, value);
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function buildNavigationHref(path: string, query?: Record<string, string>) {
  return `${path}${toQueryString(query)}`;
}

function normalizeGroupId(group: NavConfigGroup, index: number) {
  return `${slugify(group.group) || 'group'}-${index}`;
}

function normalizeItemId(groupId: string, item: { label: string; path?: string }, index: number) {
  const base = item.label ?? item.path ?? `item-${index}`;
  return `${groupId}-${slugify(base) || index}`;
}

function getItemRoles(item: { roles?: NavSubRole[]; subRole?: NavSubRole[] }) {
  return item.subRole ?? item.roles ?? [];
}

function matchesSubRole(item: { roles?: NavSubRole[]; subRole?: NavSubRole[] }, subRole?: NavSubRole) {
  const roles = getItemRoles(item);
  if (!roles.length) return true;
  if (!subRole) return true;
  return roles.includes(subRole);
}

function resolveStage(group: NavConfigGroup) {
  return group.stage ?? inferStage(group.group);
}

function createLeaf(groupId: string, stage: NavStage, item: NavConfigLeaf, itemIndex: number): NavLeaf {
  return {
    type: 'leaf',
    id: normalizeItemId(groupId, item, itemIndex),
    label: item.label,
    path: item.path,
    to: buildNavigationHref(item.path, item.query),
    roles: item.roles,
    subRole: item.subRole,
    dynamic: item.dynamic,
    hiddenInNav: item.hiddenInNav,
    activeParentPath: item.activeParentPath,
    badgeKey: item.badgeKey,
    recentDynamic: item.recentDynamic,
    stage,
  };
}

function cleanupGroupItems(items: NavGroupItem[]) {
  const cleaned: NavGroupItem[] = [];
  items.forEach((item, index) => {
    if (isNavSectionTitle(item)) {
      const hasNextContent = items.slice(index + 1).some((candidate) => !isNavSectionTitle(candidate));
      if (!hasNextContent) return;
      const previous = cleaned[cleaned.length - 1];
      if (previous && isNavSectionTitle(previous)) return;
      cleaned.push(item);
      return;
    }
    cleaned.push(item);
  });
  return cleaned;
}

function buildNavGroups(view: AppView, options: NavOptions = {}): NavGroup[] {
  const groups = getNavGroupsForView(view);
  const includeHidden = options.includeHidden === true;
  return groups
    .map((group, groupIndex) => {
      const groupId = normalizeGroupId(group, groupIndex);
      const stage = resolveStage(group);
      const items = group.items
        .flatMap((item, itemIndex): NavGroupItem[] => {
          if (!matchesSubRole(item, view === 'consumer' ? options.consumerSubRole : undefined)) {
            return [];
          }

          if (item.type === 'sectionTitle') {
            return [
              {
                type: 'sectionTitle',
                id: normalizeItemId(groupId, item, itemIndex),
                label: item.label,
                roles: item.roles,
                subRole: item.subRole,
              },
            ];
          }

          if (item.type === 'collapsible') {
            const children = item.children
              .filter((child) => matchesSubRole(child, view === 'consumer' ? options.consumerSubRole : undefined))
              .map((child, childIndex) => createLeaf(`${groupId}-collapsible-${itemIndex}`, stage, child, childIndex))
              .filter((child) => includeHidden || !child.hiddenInNav);

            if (!children.length || (!includeHidden && !children.some((child) => !child.hiddenInNav && !child.dynamic))) {
              return [];
            }

            return [
              {
                type: 'collapsible',
                id: normalizeItemId(groupId, item, itemIndex),
                label: item.label,
                roles: item.roles,
                subRole: item.subRole,
                stage,
                children,
              } satisfies NavCollapsible,
            ];
          }

          return [createLeaf(groupId, stage, item, itemIndex)];
        })
        .filter((item) => includeHidden || !isNavLeaf(item) || !item.hiddenInNav)
        .filter(
          (item) =>
            includeHidden || !isNavCollapsible(item) || item.children.some((child) => !child.hiddenInNav && !child.dynamic),
        );

      const cleanedItems = cleanupGroupItems(items);
      if (!cleanedItems.length) return null;

      return {
        id: groupId,
        label: group.group,
        stage,
        items: cleanedItems,
      } satisfies NavGroup;
    })
    .filter((group): group is NavGroup => Boolean(group));
}

function flattenMatchRecords(groups: NavGroup[]) {
  const visiblePathToId = new Map<string, string>();
  const visibleFallbackByGroup = new Map<string, string>();
  groups.forEach((group) => {
    group.items.forEach((item) => {
      if (isNavLeaf(item) && !item.hiddenInNav && !item.dynamic && !visibleFallbackByGroup.has(group.id)) {
        visibleFallbackByGroup.set(group.id, item.id);
        visiblePathToId.set(item.path, item.id);
      }
      if (isNavLeaf(item) && !item.hiddenInNav && !item.dynamic && !visiblePathToId.has(item.path)) {
        visiblePathToId.set(item.path, item.id);
      }
      if (isNavCollapsible(item)) {
        const child = item.children.find((candidate) => !candidate.hiddenInNav && !candidate.dynamic);
        if (child && !visibleFallbackByGroup.has(group.id)) {
          visibleFallbackByGroup.set(group.id, item.id);
        }
        item.children.forEach((childItem) => {
          if (!childItem.hiddenInNav && !childItem.dynamic && !visiblePathToId.has(childItem.path)) {
            visiblePathToId.set(childItem.path, childItem.id);
          }
        });
      }
    });
  });

  const records: NavMatchRecord[] = [];

  groups.forEach((group) => {
    let nearestVisibleParentId: string | null = visibleFallbackByGroup.get(group.id) ?? null;
    group.items.forEach((item) => {
      if (isNavLeaf(item)) {
        const explicitParentId = item.activeParentPath ? visiblePathToId.get(item.activeParentPath) ?? null : null;
        const fallbackParentId = item.hiddenInNav || item.dynamic ? explicitParentId ?? nearestVisibleParentId : item.id;
        if (!item.hiddenInNav && !item.dynamic && !item.recentDynamic) {
          nearestVisibleParentId = item.id;
        }
        records.push({
          id: item.id,
          path: item.path,
          parentId: fallbackParentId,
          visible: !item.hiddenInNav && !item.dynamic,
        });
        return;
      }

      if (isNavCollapsible(item)) {
        nearestVisibleParentId = item.id;
        item.children.forEach((child) => {
          records.push({
            id: child.id,
            path: child.path,
            parentId: child.hiddenInNav || child.dynamic ? item.id : child.id,
            visible: !child.hiddenInNav && !child.dynamic,
          });
        });
      }
    });
  });

  return records;
}

function getNavRecordsForView(view: AppView, options: NavOptions = {}) {
  return flattenMatchRecords(buildNavGroups(view, { ...options, includeHidden: true }));
}

function matchesPath(pathname: string, pattern: string) {
  return matchPath({ path: pattern, end: false }, pathname) != null;
}

function getBestMatch(pathname: string, records: NavMatchRecord[]) {
  return [...records]
    .filter((item) => matchesPath(pathname, item.path))
    .sort((left, right) => right.path.length - left.path.length)[0];
}

function matchesExcludedPattern(pathname: string, pattern: string) {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return matchPath({ path: pattern, end: false }, pathname) != null;
}

function isExcludedFromSideNav(pathname: string) {
  const config = navigationConfig as NavigationConfigShape;
  return (config.excludedFromNav ?? []).some((pattern) => matchesExcludedPattern(pathname, pattern));
}

export function getVisibleNavGroups(view: AppView, options: NavOptions = {}): NavGroup[] {
  return buildNavGroups(view, options);
}

export function getActiveNavItemId(pathname: string, view: AppView, options: NavOptions = {}) {
  const records = getNavRecordsForView(view, options);
  const matched = getBestMatch(pathname, records);
  if (!matched) return null;
  return matched.visible ? matched.id : matched.parentId;
}

export function hasSideNav(pathname: string, view: AppView, options: NavOptions = {}) {
  if (isExcludedFromSideNav(pathname)) return false;
  const visibleGroups = getVisibleNavGroups(view, options);
  if (visibleGroups.length === 0) return false;
  return getBestMatch(pathname, getNavRecordsForView(view, options)) != null;
}

export function getNavigationViewLabel(view: AppView) {
  return getNavConfigForView(view)?.label ?? (view === 'producer' ? '供给' : '消费');
}

export function getConsumerSubRoleOptions() {
  return ((navigationConfig as NavigationConfigShape).views.consumer.subRoles ?? []).slice();
}

export function getUserMenuConfig(view: AppView): UserMenuConfig | null {
  const normalizedView = normalizeNavView(view);
  if (!normalizedView) return null;
  return (navigationConfig as NavigationConfigShape).userMenu[normalizedView];
}

export function getCommonUserMenuConfig(): UserMenuCommonConfig {
  return (navigationConfig as NavigationConfigShape).userMenu.common;
}
