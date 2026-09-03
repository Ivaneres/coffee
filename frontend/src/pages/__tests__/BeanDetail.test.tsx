import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import BeanDetail from '../BeanDetail';
import { beansApi } from '../../api/beans';
import { recordsApi } from '../../api/records';

jest.mock('../../api/beans');
jest.mock('../../api/records');

const mockUseAuth = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
}));

describe('BeanDetail', () => {
  const mockBean = {
    id: 1,
    user_id: 1,
    variety: 'Ethiopian Yirgacheffe',
    roaster: 'Blue Bottle',
    seller: 'Coffee Shop',
    roast_level: 'Light',
    created_at: '2024-01-01',
  };

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
    jest.mocked(beansApi.getById).mockImplementation(() => new Promise(() => {}));
    jest.mocked(recordsApi.getAll).mockImplementation(() => new Promise(() => {}));

    render(<BeanDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display bean details', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(recordsApi.getAll).mockResolvedValue([]);

    render(<BeanDetail />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
      expect(screen.getByText('Roaster')).toBeInTheDocument();
      expect(screen.getByText('Blue Bottle')).toBeInTheDocument();
    });
  });

  it('should display records for the bean', async () => {
    const mockRecords = [
      {
        id: 1,
        user_id: 1,
        bean_id: 1,
        machine: 'La Marzocco',
        grinder: 'Eureka',
        rating: 8,
        created_at: '2024-01-01',
      },
    ];

    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(recordsApi.getAll).mockResolvedValue(mockRecords);

    render(<BeanDetail />);

    await waitFor(() => {
      expect(screen.getByText('La Marzocco')).toBeInTheDocument();
      expect(screen.getByText('Eureka')).toBeInTheDocument();
    });
  });

  it('should navigate to add record page', async () => {
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(recordsApi.getAll).mockResolvedValue([]);

    render(<BeanDetail />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
    });

    const addRecordButton = screen.getAllByRole('button', { name: /log shot/i })[0];
    await userEvent.click(addRecordButton);

    expect(mockNavigate).toHaveBeenCalledWith('/beans/1/add-record');
  });

  it('should delete bean when confirmed', async () => {
    window.confirm = jest.fn(() => true);
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(beansApi.delete).mockResolvedValue(undefined);
    jest.mocked(recordsApi.getAll).mockResolvedValue([]);

    render(<BeanDetail />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete bean/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(beansApi.delete).toHaveBeenCalledWith(1);
      expect(mockNavigate).toHaveBeenCalledWith('/beans');
    });
  });

  it('should not delete bean when cancelled', async () => {
    window.confirm = jest.fn(() => false);
    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(recordsApi.getAll).mockResolvedValue([]);

    render(<BeanDetail />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete bean/i });
    await userEvent.click(deleteButton);

    expect(beansApi.delete).not.toHaveBeenCalled();
  });

  it('should filter records by machine and grinder', async () => {
    const mockRecords = [
      {
        id: 1,
        user_id: 1,
        bean_id: 1,
        machine: 'La Marzocco',
        grinder: 'Eureka',
        created_at: '2024-01-01',
      },
      {
        id: 2,
        user_id: 1,
        bean_id: 1,
        machine: 'Rancilio',
        grinder: 'Eureka',
        created_at: '2024-01-02',
      },
    ];

    jest.mocked(beansApi.getById).mockResolvedValue(mockBean);
    jest.mocked(recordsApi.getAll).mockResolvedValue(mockRecords);

    render(<BeanDetail />);

    await waitFor(() => {
      expect(screen.getByText('La Marzocco')).toBeInTheDocument();
      expect(screen.getByText('Rancilio')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /filter by equipment/i }));
    const machineInput = screen.getByPlaceholderText(/search by machine/i);
    await userEvent.type(machineInput, 'La Marzocco');

    await waitFor(() => {
      expect(screen.getByText('La Marzocco')).toBeInTheDocument();
      expect(screen.queryByText('Rancilio')).not.toBeInTheDocument();
    });
  });
});
