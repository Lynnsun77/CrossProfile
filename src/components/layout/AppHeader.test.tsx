import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGlobalState } from '../../store/globalState';
import { AppHeader } from './AppHeader';

vi.mock('./GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
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
      currentUser: { ...initialState.currentUser },
      breadcrumb: [...initialState.breadcrumb],
    });
  });
});

describe('AppHeader', () => {
  it('shows user menu groups, fallback switch, and logout in avatar menu', () => {
    act(() => {
      useGlobalState.setState({
        currentView: 'producer',
        availableViews: ['consumer', 'producer', 'operator'],
        defaultView: 'consumer',
        currentUser: {
          id: 'user_platform_admin_001',
          name: '赵六',
          avatar: '',
          teamId: 'team_platform',
          team: '平台治理',
        },
      });
    });

    render(
      <MemoryRouter initialEntries={['/dashboard?view=producer']}>
        <AppHeader />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '打开头像菜单' }));

    expect(screen.getByText('我的供给')).toBeInTheDocument();
    expect(screen.getByText('个人中心')).toBeInTheDocument();
    expect(screen.getByText('我的资产')).toBeInTheDocument();
    expect(screen.getByText('我负责的工单')).toBeInTheDocument();
    expect(screen.getByText('我的归因报告')).toBeInTheDocument();
    expect(screen.getByText('切换到消费视角')).toBeInTheDocument();
    expect(screen.getByText('登出')).toBeInTheDocument();
  });
});
