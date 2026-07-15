import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Login from '../Login';
import * as authApi from '../../api/auth';

jest.mock('../../api/auth');
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockedUseAuth(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      register: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
    });
  });

  it('should render login form', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    // Check for inputs by label
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<Login />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/beans');
    });
  });

  it('should display error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    const error = new Error(errorMessage);
    (error as any).response = { data: { detail: errorMessage } };
    mockLogin.mockRejectedValue(error);

    render(<Login />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });


  it('should have link to register page', () => {
    render(<Login />);

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
