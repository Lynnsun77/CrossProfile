import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getUserPermissionsApi } from './api/permissions';
import { SideNav } from './components/nav/SideNav';
import { AppHeader } from './components/layout/AppHeader';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { useGlobalState } from './store/globalState';
import { hasSideNav } from './lib/navigation';
import {
  getPreferredView,
  getRouteDefaultView,
  getSupportedViewsForPath,
  parseRoleFromSearch,
  parseViewFromSearch,
  updateSearchParam,
} from './lib/view';
import './index.css';

function GlobalStateBridge() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentView = useGlobalState((s) => s.currentView);
  const availableViews = useGlobalState((s) => s.availableViews);
  const defaultView = useGlobalState((s) => s.defaultView);
  const permissionsLoaded = useGlobalState((s) => s.permissionsLoaded);
  const setUserPermission = useGlobalState((s) => s.setUserPermission);
  const setCurrentView = useGlobalState((s) => s.setCurrentView);

  useEffect(() => {
    let cancelled = false;
    const roleOverride = parseRoleFromSearch(location.search) ?? undefined;

    getUserPermissionsApi(roleOverride)
      .then((permission) => {
        if (!cancelled) setUserPermission(permission);
      })
      .catch(() => {
        if (!cancelled) {
          void getUserPermissionsApi().then((permission) => {
            if (!cancelled) setUserPermission(permission);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.search, setUserPermission]);

  useEffect(() => {
    if (!permissionsLoaded) return;

    const requestedView = parseViewFromSearch(location.search);
    const supportedViews = getSupportedViewsForPath(location.pathname);
    const routeDefaultView = getRouteDefaultView(location.pathname);
    const nextView =
      !requestedView && routeDefaultView && supportedViews.includes(routeDefaultView) && availableViews.includes(routeDefaultView)
        ? routeDefaultView
        : getPreferredView(requestedView, currentView, defaultView, availableViews, supportedViews);

    if (nextView !== currentView) {
      setCurrentView(nextView);
    }

    if ((requestedView && requestedView !== nextView) || (!requestedView && routeDefaultView)) {
      navigate(
        {
          pathname: location.pathname,
          search: updateSearchParam(location.search, 'view', nextView),
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [
    availableViews,
    currentView,
    defaultView,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    permissionsLoaded,
    setCurrentView,
  ]);

  return null;
}

function App() {
  const location = useLocation();
  const hasBreadcrumb = useGlobalState((s) => s.breadcrumb.length > 0);
  const currentView = useGlobalState((s) => s.currentView);
  const consumerSubRole = useGlobalState((s) => s.consumerSubRole);
  const sideNavCollapsed = useGlobalState((s) => s.sideNavCollapsed);
  const showSideNav = hasSideNav(location.pathname, currentView, { consumerSubRole });

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalStateBridge />
      <AppHeader />
      {hasBreadcrumb && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center">
            <Breadcrumb />
          </div>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {showSideNav && !sideNavCollapsed ? (
          <div className="hidden lg:block">
            <SideNav pathname={location.pathname} />
          </div>
        ) : null}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
