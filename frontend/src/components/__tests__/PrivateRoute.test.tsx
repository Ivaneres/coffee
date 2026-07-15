import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test-utils';
import PrivateRoute from '../PrivateRoute';

const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' },
    });

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );

    // Should redirect, so protected content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
