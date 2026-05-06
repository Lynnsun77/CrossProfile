import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobalState } from '../../store/globalState';
import type { AppView } from '../../types';
import { buildLandingUrlForView } from '../../lib/view';
import { getNavigationViewLabel, hasSideNav } from '../../lib/navigation';
import { GlobalSearch } from './GlobalSearch';
import { UserMenu } from './UserMenu';

const HEADER_VIEWS: Array<{ view: AppView; label: string }> = [
  { view: 'consumer', label: getNavigationViewLabel('consumer') },
  { view: 'producer', label: getNavigationViewLabel('producer') },
];

function resolveHeaderView(view: AppView): AppView {
  return view === 'consumer' ? 'consumer' : 'producer';
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentView = useGlobalState((s) => s.currentView);
  const availableViews = useGlobalState((s) => s.availableViews);
  const consumerSubRole = useGlobalState((s) => s.consumerSubRole);
  const sideNavCollapsed = useGlobalState((s) => s.sideNavCollapsed);
  const setCurrentView = useGlobalState((s) => s.setCurrentView);
  const toggleSideNav = useGlobalState((s) => s.toggleSideNav);
  const activeView = resolveHeaderView(currentView);
  const headerAvailableViews = useMemo(
    () => HEADER_VIEWS.filter((item) => availableViews.some((view) => resolveHeaderView(view) === item.view)).map((item) => item.view),
    [availableViews]
  );
  const shouldShowSideNavToggle = useMemo(
    () =>
      hasSideNav(
        location.pathname,
        currentView,
        currentView === 'consumer' ? { consumerSubRole } : {}
      ),
    [consumerSubRole, currentView, location.pathname]
  );
  const sideNavToggleLabel = sideNavCollapsed ? '展开侧边导航' : '收起侧边导航';

  const handleViewSwitch = (nextView: AppView) => {
    if (!headerAvailableViews.includes(nextView)) return;
    setCurrentView(nextView);
    navigate(buildLandingUrlForView(nextView, location.search));
  };

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            {shouldShowSideNavToggle ? (
              <button
                type="button"
                aria-label={sideNavToggleLabel}
                onClick={toggleSideNav}
                className="shrink-0 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:bg-bg hover:text-text-1"
              >
                {sideNavCollapsed ? '展开侧导' : '收起侧导'}
              </button>
            ) : null}

            <Link to={buildLandingUrlForView(activeView, location.search)} className="shrink-0 text-xl font-bold text-text-1">
              Cross-Profile
            </Link>

            <nav className="flex items-center gap-1 rounded-full border border-border bg-white p-1">
              {HEADER_VIEWS.map((item) => {
                const selected = activeView === item.view;
                const disabled = !headerAvailableViews.includes(item.view);
                return (
                  <button
                    key={item.view}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => handleViewSwitch(item.view)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-gray-900 text-white'
                        : disabled
                          ? 'cursor-not-allowed text-text-4'
                          : 'text-text-2 hover:bg-bg hover:text-text-1'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <GlobalSearch />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
