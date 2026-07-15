import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Navbar from '../Navbar';

const mockUseAuth = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render brand link', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
    });

    render(<Navbar />);

    const brandLink = screen.getByRole('link', { name: /espresso tracker/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/beans');
  });

  it('should show navigation links when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' },
      logout: jest.fn(),
    });

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /beans/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should not show navigation links when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
    });

    render(<Navbar />);

    expect(screen.queryByRole('link', { name: /beans/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('should handle logout', async () => {
    
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' },
      logout: mockLogout,
    });

    render(<Navbar />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
