import type { MyBadgeSource } from '../../api/my';

export type NavSubRole = 'business' | 'algorithm';
export type NavStage = 'market' | 'workshop' | 'dashboard' | 'neutral';

export type NavRecentDynamicConfig = {
  bucket: string;
};

export type NavRecentVisit = {
  id: string;
  label: string;
  to: string;
  matchPath?: string;
  visitedAt: number;
};

type NavVisibilityMeta = {
  roles?: NavSubRole[];
  subRole?: NavSubRole[];
  hiddenInNav?: boolean;
  dynamic?: boolean;
  activeParentPath?: string;
};

export type NavLeaf = NavVisibilityMeta & {
  type: 'leaf';
  id: string;
  label: string;
  path: string;
  to: string;
  badgeKey?: MyBadgeSource;
  recentDynamic?: NavRecentDynamicConfig;
  stage: NavStage;
};

export type NavSectionTitle = NavVisibilityMeta & {
  type: 'sectionTitle';
  id: string;
  label: string;
};

export type NavCollapsible = NavVisibilityMeta & {
  type: 'collapsible';
  id: string;
  label: string;
  stage: NavStage;
  children: NavLeaf[];
};

export type NavGroupItem = NavLeaf | NavSectionTitle | NavCollapsible;

export type NavGroupDef = {
  id: string;
  label: string;
  stage: NavStage;
  items: NavGroupItem[];
};

export function isNavLeaf(item: NavGroupItem): item is NavLeaf {
  return item.type === 'leaf';
}

export function isNavSectionTitle(item: NavGroupItem): item is NavSectionTitle {
  return item.type === 'sectionTitle';
}

export function isNavCollapsible(item: NavGroupItem): item is NavCollapsible {
  return item.type === 'collapsible';
}
