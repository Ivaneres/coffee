import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import AddRecord from '../AddRecord';
import { beansApi } from '../../api/beans';
import { recordsApi } from '../../api/records';
import { settingsApi } from '../../api/settings';

jest.mock('../../api/beans');
jest.mock('../../api/records');
jest.mock('../../api/settings');

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

const advanceToFinish = async () => {
  // Dose → Time → Grind → Yield → Finish
  for (let i = 0; i < 4; i += 1) {
    await userEvent.click(screen.getByRole('button', { name: /^next$/i }));
  }
};

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
    default_dose: 18,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    jest.mocked(recordsApi.getAll).mockResolvedValue([]);
  });

  it('should display loading state initially', () => {
    jest.mocked(beansApi.getById).mockImplementation(() => new Promise(() => {}));
    jest.mocked(settingsApi.get).mockImplementation(() => new Promise(() => {}));

    render(<AddRecord />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should load bean and settings data', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dose$/i })).toBeInTheDocument();
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
    }, { timeout: 3000 });

    const doseInput = screen.getByLabelText('Dose') as HTMLInputElement;
    expect(doseInput.value).toBe('18');
  });

  it('should create new record through wizard', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);
    const newRecord = {
      id: 1,
      user_id: 1,
      bean_id: 1,
      machine: 'La Marzocco',
      grinder: 'Eureka',
      created_at: '2024-01-01',
    };
    jest.mocked(recordsApi.create).mockResolvedValue(newRecord);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dose$/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    await userEvent.clear(screen.getByLabelText('Dose'));
    await userEvent.type(screen.getByLabelText('Dose'), '18');
    await userEvent.click(screen.getByRole('button', { name: /^next$/i }));

    await userEvent.type(screen.getByLabelText('Time'), '30');
    await userEvent.click(screen.getByRole('button', { name: /^next$/i }));

    await userEvent.type(screen.getByLabelText('Grind Size'), '5');
    await userEvent.click(screen.getByRole('button', { name: /^next$/i }));

    await userEvent.type(screen.getByLabelText('Yield'), '36');
    await userEvent.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /save shot/i })).toBeInTheDocument();
      expect(screen.getByText('La Marzocco')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /notes/i }));
    await userEvent.type(screen.getByLabelText('Notes'), 'Great shot!');

    await userEvent.click(screen.getByRole('button', { name: /save shot/i }));

    await waitFor(() => {
      expect(recordsApi.create).toHaveBeenCalledWith(
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

    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);
    jest.mocked(recordsApi.getById).mockResolvedValue(existingRecord);
    jest.mocked(recordsApi.update).mockResolvedValue({ ...existingRecord, notes: 'Updated notes' });

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dose$/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    await advanceToFinish();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^edit shot$/i })).toBeInTheDocument();
    });

    const notesTextarea = screen.getByLabelText('Notes');
    await userEvent.clear(notesTextarea);
    await userEvent.type(notesTextarea, 'Updated notes');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(recordsApi.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          notes: 'Updated notes',
        })
      );
    });
  });

  it('should require machine and grinder fields', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dose$/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    await advanceToFinish();

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    const machineInput = screen.getByLabelText('Machine *') as HTMLInputElement;
    const grinderInput = screen.getByLabelText('Grinder *') as HTMLInputElement;

    expect(machineInput).toBeRequired();
    expect(grinderInput).toBeRequired();
  });

  it('should handle rating sliders', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dose$/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    await advanceToFinish();
    await userEvent.click(screen.getByRole('button', { name: /rate this shot/i }));

    const ratingSlider = screen.getByLabelText('Overall') as HTMLInputElement;
    await userEvent.clear(ratingSlider);
    await userEvent.type(ratingSlider, '6');

    await waitFor(() => {
      expect(ratingSlider.value).toBe('6');
    });
  });

  it('should navigate back when cancel is clicked', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(settingsApi.get).mockResolvedValue(mockSettings);

    render(<AddRecord />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dose$/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/beans/1');
  });
});
