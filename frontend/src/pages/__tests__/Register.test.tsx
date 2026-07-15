import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Register from '../Register';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    register: mockRegister,
    logout: jest.fn(),
    isAuthenticated: false,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render register form', () => {
    render(<Register />);

    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    // Check for inputs by role (labels don't have htmlFor)
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThanOrEqual(2); // Username and Email
    // Password input is type="password", find it by type
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);

    render(<Register />);

    const textboxes = screen.getAllByRole('textbox');
    const usernameInput = textboxes[0];
    const emailInput = textboxes[1];
    // Find password input by its type
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    await userEvent.type(usernameInput, 'newuser');
    await userEvent.type(emailInput, 'newuser@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser', 'newuser@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/beans');
    });
  });

  it('should display error message on registration failure', async () => {
    const errorMessage = 'Username already exists';
    const error = new Error(errorMessage);
    (error as any).response = { data: { detail: errorMessage } };
    mockRegister.mockRejectedValue(error);

    render(<Register />);

    const textboxes = screen.getAllByRole('textbox');
    const usernameInput = textboxes[0];
    const emailInput = textboxes[1];
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    await userEvent.type(usernameInput, 'existinguser');
    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });


  it('should have link to login page', () => {
    render(<Register />);

    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
