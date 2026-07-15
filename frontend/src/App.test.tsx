import React from 'react';
import { screen, waitFor, render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { authApi } from './api/auth';
import { beansApi } from './api/beans';

// App already has Router, so we don't need test-utils which adds another Router
const render = (ui: React.ReactElement) => {
  return rtlRender(ui);
};

jest.mock('./api/auth');
jest.mock('./api/beans');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should show navbar when authenticated', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' };
    localStorage.setItem('token', 'valid-token');
    jest.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);
    jest.mocked(beansApi.getAll).mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/espresso tracker/i)).toBeInTheDocument();
    });
  });
});
