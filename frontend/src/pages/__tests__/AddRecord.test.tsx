import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import AddRecord from '../AddRecord';
import * as beansApi from '../../api/beans';
import * as recordsApi from '../../api/records';
import * as settingsApi from '../../api/settings';

jest.mock('../../api/beans');
jest.mock('../../api/records');
jest.mock('../../api/settings');
const mockedBeansApi = beansApi as jest.Mocked<typeof beansApi>;
const mockedRecordsApi = recordsApi as jest.Mocked<typeof recordsApi>;
const mockedSettingsApi = settingsApi as jest.Mocked<typeof settingsApi>;

const mockUseAuth = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

const mockUseParams = jest.fn(() => ({ id: '1' }));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

describe('AddRecord', () => {
  const mockBean = {
    id: 1,
    user_id: 1,
    variety: 'Ethiopian Yirgacheffe',
    created_at: '2024-01-01',
  };

  const mockSettings = {
    id: 1,
    user_id: 1,
    default_machine: 'La Marzocco',
    default_grinder: 'Eureka',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' }); // Reset to default
    // Ensure mocks are set up
    (mockedBeansApi.getById as jest.Mock) = jest.fn();
    (mockedRecordsApi.create as jest.Mock) = jest.fn();
    (mockedRecordsApi.update as jest.Mock) = jest.fn();
    (mockedRecordsApi.getById as jest.Mock) = jest.fn();
    (mockedSettingsApi.get as jest.Mock) = jest.fn();
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
    (mockedBeansApi.getById as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (mockedSettingsApi.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<AddRecord />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load bean and settings data', async () => {
    (mockedBeansApi.getById as jest.Mock).mockResolvedValue(mockBean);
    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByText(/add record|edit record/i)).toBeInTheDocument();
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for form to be populated with default values
    await waitFor(() => {
      const machineInput = screen.getByDisplayValue('La Marzocco') as HTMLInputElement;
      const grinderInput = screen.getByDisplayValue('Eureka') as HTMLInputElement;
      expect(machineInput).toBeInTheDocument();
      expect(grinderInput).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should create new record', async () => {
    (mockedBeansApi.getById as jest.Mock).mockResolvedValue(mockBean);
    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);
    const newRecord = {
      id: 1,
      user_id: 1,
      bean_id: 1,
      machine: 'La Marzocco',
      grinder: 'Eureka',
      created_at: '2024-01-01',
    };
    (mockedRecordsApi.create as jest.Mock).mockResolvedValue(newRecord);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByText(/add record|edit record/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find inputs by finding labels and then their sibling inputs
    const grindSizeLabel = screen.getByText('Grind Size');
    const grindSizeInput = grindSizeLabel.parentElement?.querySelector('input') as HTMLInputElement;
    const doseLabel = screen.getByText('Dose (grams)');
    const doseInput = doseLabel.parentElement?.querySelector('input') as HTMLInputElement;
    const extractionTimeLabel = screen.getByText('Extraction Time (seconds)');
    const extractionTimeInput = extractionTimeLabel.parentElement?.querySelector('input') as HTMLInputElement;
    const yieldLabel = screen.getByText('Yield (grams)');
    const yieldInput = yieldLabel.parentElement?.querySelector('input') as HTMLInputElement;
    const notesLabel = screen.getByText('Notes');
    const notesTextarea = notesLabel.parentElement?.querySelector('textarea') as HTMLTextAreaElement;
    
    await userEvent.type(grindSizeInput, '5');
    await userEvent.type(doseInput, '18');
    await userEvent.type(extractionTimeInput, '30');
    await userEvent.type(yieldInput, '36');
    await userEvent.type(notesTextarea, 'Great shot!');

    const submitButton = screen.getByRole('button', { name: /create record/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedRecordsApi.create as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          bean_id: 1,
          machine: 'La Marzocco',
          grinder: 'Eureka',
          grind_size: '5',
          dose: 18,
          extraction_time: 30,
          yield_amount: 36,
          notes: 'Great shot!',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/beans/1');
    });
  });

  it('should update existing record in edit mode', async () => {
    
    // Change useParams to return recordId for edit mode
    mockUseParams.mockReturnValue({ id: '1', recordId: '1' });

    const existingRecord = {
      id: 1,
      user_id: 1,
      bean_id: 1,
      machine: 'La Marzocco',
      grinder: 'Eureka',
      grind_size: '5',
      dose: 18,
      extraction_time: 30,
      yield_amount: 36,
      rating: 8,
      notes: 'Original notes',
      created_at: '2024-01-01',
    };

    (mockedBeansApi.getById as jest.Mock).mockResolvedValue(mockBean);
    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);
    (mockedRecordsApi.getById as jest.Mock).mockResolvedValue(existingRecord);
    (mockedRecordsApi.update as jest.Mock).mockResolvedValue({ ...existingRecord, notes: 'Updated notes' });

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByText(/edit record/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const notesLabel = screen.getByText('Notes');
    const notesTextarea = notesLabel.parentElement?.querySelector('textarea') as HTMLTextAreaElement;
    await userEvent.clear(notesTextarea);
    await userEvent.type(notesTextarea, 'Updated notes');

    const submitButton = screen.getByRole('button', { name: /update record/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedRecordsApi.update as jest.Mock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          notes: 'Updated notes',
        })
      );
    });
  });

  it('should require machine and grinder fields', async () => {
    (mockedBeansApi.getById as jest.Mock).mockResolvedValue(mockBean);
    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByText(/add record|edit record/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const machineInput = screen.getByLabelText('Machine *') as HTMLInputElement;
    await userEvent.clear(machineInput);

    const submitButton = screen.getByRole('button', { name: /create record/i });
    await userEvent.click(submitButton);

    expect(mockedRecordsApi.create as jest.Mock).not.toHaveBeenCalled();
  });

  it('should handle rating sliders', async () => {
    (mockedBeansApi.getById as jest.Mock).mockResolvedValue(mockBean);
    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByText(/add record|edit record/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const ratingSlider = screen.getByLabelText('Overall Rating');
    await userEvent.type(ratingSlider, '{arrowright}');

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  it('should navigate back when cancel is clicked', async () => {
    (mockedBeansApi.getById as jest.Mock).mockResolvedValue(mockBean);
    (mockedSettingsApi.get as jest.Mock).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByText(/add record|edit record/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/beans/1');
  });
});
