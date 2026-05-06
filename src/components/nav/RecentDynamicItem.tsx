import { matchPath } from 'react-router-dom';
import type { MyBadgeMap } from '../../api/my';
import { NavItem } from './NavItem';
import { getStageTheme } from './nav.theme';
import type { NavLeaf } from './nav.types';
import { useRecentVisits } from './useRecentVisits';

function isActivePath(pathname: string, target: string) {
  return matchPath({ path: target, end: false }, pathname) != null;
}

export function RecentDynamicItem({
  item,
  pathname,
  active,
  badges,
}: {
  item: NavLeaf;
  pathname: string;
  active: boolean;
  badges: MyBadgeMap;
}) {
  const theme = getStageTheme(item.stage);
  const bucket = item.recentDynamic?.bucket ?? '';
  const { visits } = useRecentVisits(bucket);

  return (
    <div className="space-y-1">
      <NavItem item={item} active={active} badges={badges} />
      {visits.length ? (
        <div className="ml-5 space-y-1 border-l border-border pl-3">
          {visits.map((visit) => {
            const visitActive = isActivePath(pathname, visit.matchPath ?? visit.to);
            return (
              <a
                key={visit.id}
                href={visit.to}
                className={[
                  'relative block rounded-lg px-3 py-2 text-sm transition-colors',
                  visitActive ? theme.itemActive : `${theme.itemText} ${theme.itemHover}`,
                ].join(' ')}
              >
                <span className="truncate">{visit.label}</span>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
