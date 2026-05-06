import type { MyBadgeMap } from '../../api/my';
import { CollapsibleItem } from './CollapsibleItem';
import { NavItem } from './NavItem';
import { RecentDynamicItem } from './RecentDynamicItem';
import { SectionTitle } from './SectionTitle';
import { getStageTheme } from './nav.theme';
import type { NavGroup as NavGroupType } from '../../lib/navigation';
import { isNavCollapsible, isNavLeaf, isNavSectionTitle } from './nav.types';

export function NavGroup({
  group,
  pathname,
  activeItemId,
  badges,
}: {
  group: NavGroupType;
  pathname: string;
  activeItemId: string | null;
  badges: MyBadgeMap;
}) {
  const theme = getStageTheme(group.stage);

  return (
    <section>
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className={`h-2 w-2 rounded-full ${theme.groupAccent}`} />
        <div className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${theme.groupLabel}`}>{group.label}</div>
      </div>
      <div className="space-y-1">
        {group.items.map((item) => {
          if (isNavSectionTitle(item)) {
            return <SectionTitle key={item.id} item={item} />;
          }
          if (isNavCollapsible(item)) {
            return <CollapsibleItem key={item.id} item={item} activeItemId={activeItemId} badges={badges} />;
          }
          if (isNavLeaf(item) && item.recentDynamic) {
            return <RecentDynamicItem key={item.id} item={item} pathname={pathname} active={item.id === activeItemId} badges={badges} />;
          }
          return <NavItem key={item.id} item={item} active={item.id === activeItemId} badges={badges} />;
        })}
      </div>
    </section>
  );
}
