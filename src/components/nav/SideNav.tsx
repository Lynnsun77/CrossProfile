import { getActiveNavItemId, getVisibleNavGroups } from '../../lib/navigation';
import { useGlobalState } from '../../store/globalState';
import { NavGroup } from './NavGroup';
import { useMyBadges } from './useMyBadges';

type SideNavProps = {
  pathname: string;
};

export function SideNav({ pathname }: SideNavProps) {
  const currentView = useGlobalState((s) => s.currentView);
  const consumerSubRole = useGlobalState((s) => s.consumerSubRole);
  const groups = getVisibleNavGroups(currentView, { consumerSubRole });
  const activeItemId = getActiveNavItemId(pathname, currentView, { consumerSubRole });
  const badges = useMyBadges(currentView === 'producer' ? 'producer' : 'consumer');

  if (!groups.length) return null;

  return (
    <aside className="sticky top-6 w-64 shrink-0 self-start rounded-2xl border border-border bg-white p-3 shadow-sm">
      <div className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-4">导航</div>
      <nav className="space-y-4" aria-label="侧边导航">
        {groups.map((group) => (
          <NavGroup key={group.id} group={group} pathname={pathname} activeItemId={activeItemId} badges={badges} />
        ))}
      </nav>
    </aside>
  );
}
