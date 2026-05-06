import { APP_VIEWS, USER_ROLES, type AppView, type UserRole } from '../types';

const FULL_MULTI_VIEWS: AppView[] = ['consumer', 'producer', 'operator'];
const MARKETPLACE_VIEWS: AppView[] = ['consumer', 'producer'];
const CONSUMER_ONLY_VIEWS: AppView[] = ['consumer'];
const PRODUCER_ONLY_VIEWS: AppView[] = ['producer'];
const EXPOSED_SWITCHER_VIEWS: AppView[] = ['consumer', 'producer'];

export function isAppView(value: string | null | undefined): value is AppView {
  return !!value && APP_VIEWS.includes(value as AppView);
}

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && USER_ROLES.includes(value as UserRole);
}

export function normalizeLegacyView(value: string | null | undefined): AppView | null {
  if (value === 'supplier') return 'producer';
  if (value === 'ops') return 'operator';
  return isAppView(value) ? value : null;
}

export function parseViewFromSearch(search: string): AppView | null {
  const params = new URLSearchParams(search);
  return normalizeLegacyView(params.get('view'));
}

export function parseRoleFromSearch(search: string): UserRole | null {
  const params = new URLSearchParams(search);
  const role = params.get('role');
  return isUserRole(role) ? role : null;
}

export function updateSearchParam(search: string, key: string, value: string | null) {
  const params = new URLSearchParams(search);
  if (value == null || value === '') params.delete(key);
  else params.set(key, value);
  const next = params.toString();
  return next ? `?${next}` : '';
}

export function getSupportedViewsForPath(pathname: string): AppView[] {
  if (
    pathname.startsWith('/quality/auto-backtest') ||
    pathname.startsWith('/quality/self-review') ||
    pathname.startsWith('/quality/llm-judge') ||
    pathname.startsWith('/quality/survey') ||
    pathname.startsWith('/quality/health-score')
  ) {
    return PRODUCER_ONLY_VIEWS;
  }

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/recommender') ||
    pathname.startsWith('/quality') ||
    pathname.startsWith('/drilldown')
  ) {
    return FULL_MULTI_VIEWS;
  }

  if (pathname.startsWith('/marketplace') || pathname.startsWith('/factory')) {
    return MARKETPLACE_VIEWS;
  }

  return CONSUMER_ONLY_VIEWS;
}

export function getRouteDefaultView(pathname: string): AppView | null {
  if (pathname === '/marketplace' || pathname === '/marketplace/') {
    return 'consumer';
  }
  return null;
}

export function getExposedSwitcherViews(supportedViews: AppView[]) {
  return EXPOSED_SWITCHER_VIEWS.filter((view) => supportedViews.includes(view));
}

export function getPreferredView(
  requestedView: AppView | null,
  currentView: AppView,
  defaultView: AppView,
  availableViews: AppView[],
  supportedViews: AppView[]
) {
  const enabledViews = supportedViews.filter((view) => availableViews.includes(view));
  const fallback =
    (enabledViews.includes(currentView) && currentView) ||
    (enabledViews.includes(defaultView) && defaultView) ||
    enabledViews[0] ||
    'consumer';

  if (requestedView && enabledViews.includes(requestedView)) {
    return requestedView;
  }

  return fallback;
}

export function getLandingPathForView(view: AppView) {
  if (view === 'producer') return '/dashboard';
  if (view === 'operator') return '/dashboard';
  return '/marketplace';
}

export function buildLandingUrlForView(view: AppView, currentSearch = '') {
  const params = new URLSearchParams();
  const currentParams = new URLSearchParams(currentSearch);
  const role = currentParams.get('role');

  if (isUserRole(role)) {
    params.set('role', role);
  }

  params.set('view', view);

  const search = params.toString();
  return `${getLandingPathForView(view)}${search ? `?${search}` : ''}`;
}
