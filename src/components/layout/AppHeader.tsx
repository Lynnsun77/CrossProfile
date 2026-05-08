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
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
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
                        ? 'bg-blue-600 text-white'
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
