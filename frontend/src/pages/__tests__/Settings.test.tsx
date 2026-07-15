import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Settings from '../Settings';
import * as settingsApi from '../../api/settings';

jest.mock('../../api/settings');
const mockedSettingsApi = settingsApi as jest.Mocked<typeof settingsApi>;

const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure mocks are set up
    (mockedSettingsApi.get as jest.Mock) = jest.fn();
    (mockedSettingsApi.update as jest.Mock) = jest.fn();
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
    (mockedSettingsApi.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<Settings />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load and display current settings', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);

    render(<Settings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for form inputs to be populated with settings values
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

    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);
    (mockedSettingsApi.update as jest.Mock).mockResolvedValue(updatedSettings);

    render(<Settings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
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
      expect(mockedSettingsApi.update as jest.Mock).toHaveBeenCalledWith({
        default_machine: 'Rancilio',
        default_grinder: 'Baratza',
      });
      expect(window.alert).toHaveBeenCalledWith('Settings saved successfully!');
    });
  });

  it('should show saving state during update', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);
    (mockedSettingsApi.update as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<Settings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
      expect(machineInput.value).toBe('La Marzocco');
    }, { timeout: 3000 });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await userEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('should handle save error', async () => {
    const mockSettings = {
      id: 1,
      user_id: 1,
      default_machine: 'La Marzocco',
      default_grinder: 'Eureka',
    };

    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);
    (mockedSettingsApi.update as jest.Mock).mockRejectedValue(new Error('Save failed'));

    render(<Settings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const machineInput = screen.getByLabelText('Default Machine') as HTMLInputElement;
      expect(machineInput.value).toBe('La Marzocco');
    }, { timeout: 3000 });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to save settings');
    });
  });
});
