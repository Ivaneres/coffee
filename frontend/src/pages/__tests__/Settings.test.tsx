import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Settings from '../Settings';
import { settingsApi } from '../../api/settings';

jest.mock('../../api/settings');

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

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('should display loading state initially', () => {
    jest.mocked(settingsApi.get).mockImplementation(() => new Promise(() => {}));

    render(<Settings />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should load and display current settings', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);

    render(<Settings />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
      const grinderInput = screen.getByLabelText('Default Grinder') as HTMLInputElement;
      expect(machineInput.value).toBe('La Marzocco');
      expect(grinderInput.value).toBe('Eureka');
    }, { timeout: 3000 });
  });

  it('should update settings', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    const updatedSettings = {
      ...mockSettings,
      default_machine: 'Rancilio',
      default_grinder: 'Baratza',
    };

    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);
    jest.mocked(settingsApi.update).mockResolvedValue(updatedSettings);

    render(<Settings />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
      expect(machineInput.value).toBe('La Marzocco');
    }, { timeout: 3000 });

    const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
    const grinderInput = screen.getByLabelText('Default Grinder') as HTMLInputElement;

    await userEvent.clear(machineInput);
    await userEvent.type(machineInput, 'Rancilio');
    await userEvent.clear(grinderInput);
    await userEvent.type(grinderInput, 'Baratza');

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(settingsApi.update).toHaveBeenCalledWith({
        default_machine: 'Rancilio',
        default_grinder: 'Baratza',
        default_dose: null,
      });
      expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
    });
  });

  it('should show saving state during update', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);
    jest.mocked(settingsApi.update).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSettings), 100))
    );

    render(<Settings />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
      expect(machineInput.value).toBe('La Marzocco');
    }, { timeout: 3000 });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await userEvent.click(saveButton);

    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('should handle save error', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);
    jest.mocked(settingsApi.update).mockRejectedValue(new Error('Save failed'));

    render(<Settings />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
      expect(machineInput.value).toBe('La Marzocco');
    }, { timeout: 3000 });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save settings/i)).toBeInTheDocument();
    });
  });
});
