import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useGlobalState } from './store/globalState';

vi.mock('./components/layout/GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

vi.mock('./components/layout/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

vi.mock('./api/permissions', () => ({
  getUserPermissionsApi: vi.fn().mockResolvedValue({
    userId: 'user_platform_admin_001',
    userName: '赵六',
    teamId: 'team_platform',
    teamName: '平台治理',
    role: 'platform_admin',
    availableViews: ['consumer', 'producer', 'operator'],
    defaultView: 'consumer',
    dataScopeMode: 'global',
    enabledActions: [],
    maskedConsumerIdentity: true,
  }),
}));

const initialState = useGlobalState.getState();

afterEach(() => {
  act(() => {
    useGlobalState.setState({
      userRole: initialState.userRole,
      currentView: initialState.currentView,
      availableViews: [...initialState.availableViews],
      defaultView: initialState.defaultView,
      permissionsLoaded: initialState.permissionsLoaded,
      userPermission: initialState.userPermission,
      consumerSubRole: initialState.consumerSubRole,
      currentUser: { ...initialState.currentUser },
      breadcrumb: [...initialState.breadcrumb],
      sideNavCollapsed: true,
    });
  });
});

describe('App layout', () => {
  it('在 consumer 有侧导页面默认收起侧导，并可通过 toggle 展开和再次收起', async () => {
    act(() => {
      useGlobalState.setState({
        currentView: 'consumer',
        availableViews: ['consumer', 'producer', 'operator'],
        defaultView: 'consumer',
        permissionsLoaded: true,
        consumerSubRole: 'business',
        sideNavCollapsed: true,
      });
    });

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
          children: [{ path: 'marketplace', element: <div>Marketplace Content</div> }],
        },
      ],
      { initialEntries: ['/marketplace?view=consumer'] },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '展开侧边导航' })).toBeInTheDocument();
    });

    expect(screen.getByText('Marketplace Content')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '侧边导航' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '消费' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '供给' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /消费方|供给方|消费视角|供给视角/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '展开侧边导航' }));

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: '侧边导航' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '收起侧边导航' }));

    await waitFor(() => {
      expect(screen.queryByRole('navigation', { name: '侧边导航' })).not.toBeInTheDocument();
    });
  });

  it('在 producer 有侧导页面默认收起侧导，并显示 toggle', async () => {
    act(() => {
      useGlobalState.setState({
        currentView: 'producer',
        availableViews: ['consumer', 'producer', 'operator'],
        defaultView: 'producer',
        permissionsLoaded: true,
        consumerSubRole: 'business',
        sideNavCollapsed: true,
      });
    });

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
          children: [{ path: 'dashboard', element: <div>Dashboard Content</div> }],
        },
      ],
      { initialEntries: ['/dashboard?view=producer'] },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    expect(screen.queryByRole('navigation', { name: '侧边导航' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '展开侧边导航' })).toBeInTheDocument();
  });

  it('在 /dashboard/health 不显示侧导 toggle 和侧导，但保留页面内容', async () => {
    act(() => {
      useGlobalState.setState({
        currentView: 'producer',
        availableViews: ['consumer', 'producer', 'operator'],
        defaultView: 'producer',
        permissionsLoaded: true,
        consumerSubRole: 'business',
        sideNavCollapsed: true,
      });
    });

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
          children: [{ path: 'dashboard/health', element: <div>Health Content</div> }],
        },
      ],
      { initialEntries: ['/dashboard/health?view=producer'] },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Health Content')).toBeInTheDocument();
    });

    expect(screen.queryByRole('navigation', { name: '侧边导航' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /侧边导航/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '消费' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '供给' })).toBeInTheDocument();
  });
});
