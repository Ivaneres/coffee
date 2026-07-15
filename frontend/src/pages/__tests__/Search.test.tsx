import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Search from '../Search';
import * as beansApi from '../../api/beans';
import * as recordsApi from '../../api/records';

jest.mock('../../api/beans');
jest.mock('../../api/records');
const mockedBeansApi = beansApi as jest.Mocked<typeof beansApi>;
const mockedRecordsApi = recordsApi as jest.Mocked<typeof recordsApi>;

const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

describe('Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure mocks are set up
    (mockedBeansApi.getAll as jest.Mock) = jest.fn();
    (mockedRecordsApi.getAll as jest.Mock) = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com', created_at: '2024-01-01' },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('should display search form', () => {
    (mockedBeansApi.getAll as jest.Mock).mockResolvedValue([]);
    (mockedRecordsApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<Search />);

    expect(screen.getByText('Search Records')).toBeInTheDocument();
    expect(screen.getByText('Bean Variety')).toBeInTheDocument();
    expect(screen.getByText('Roaster')).toBeInTheDocument();
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.getByText('Grinder')).toBeInTheDocument();
    // Check for inputs by placeholder
    expect(screen.getByPlaceholderText(/blue mountain/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/la marzocco/i)).toBeInTheDocument();
  });

  it('should perform search when filters are entered', async () => {
    
    const mockRecords = [
      {
        id: 1,
        user_id: 1,
        bean_id: 1,
        machine: 'La Marzocco',
        grinder: 'Eureka',
        created_at: '2024-01-01',
      },
    ];

    (mockedBeansApi.getAll as jest.Mock).mockResolvedValue([]);
    (mockedRecordsApi.getAll as jest.Mock).mockResolvedValue(mockRecords);

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText(/enter search criteria/i)).toBeInTheDocument();
    });

    const machineInput = screen.getByPlaceholderText(/la marzocco/i);
    await userEvent.clear(machineInput);
    await userEvent.type(machineInput, 'La Marzocco');

    await waitFor(() => {
      expect(mockedRecordsApi.getAll as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          machine: 'La Marzocco',
        })
      );
    });
  });

  it('should display search results', async () => {
    
    const mockBeans = [
      {
        id: 1,
        user_id: 1,
        variety: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        created_at: '2024-01-01',
      },
    ];

    const mockRecords = [
      {
        id: 1,
        user_id: 1,
        bean_id: 1,
        machine: 'La Marzocco',
        grinder: 'Eureka',
        created_at: '2024-01-01',
      },
    ];

    (mockedBeansApi.getAll as jest.Mock).mockResolvedValue(mockBeans);
    (mockedRecordsApi.getAll as jest.Mock).mockResolvedValue(mockRecords);

    render(<Search />);

    const machineInput = screen.getByPlaceholderText(/la marzocco/i);
    await userEvent.clear(machineInput);
    await userEvent.type(machineInput, 'La Marzocco');

    await waitFor(() => {
      expect(screen.getByText('La Marzocco')).toBeInTheDocument();
      expect(screen.getByText('Eureka')).toBeInTheDocument();
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
    });
  });

  it('should show empty state when no search criteria', () => {
    (mockedBeansApi.getAll as jest.Mock).mockResolvedValue([]);
    (mockedRecordsApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<Search />);

    expect(screen.getByText(/enter search criteria/i)).toBeInTheDocument();
  });

  it('should show no results message when search returns empty', async () => {
    (mockedBeansApi.getAll as jest.Mock).mockResolvedValue([]);
    (mockedRecordsApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<Search />);

    const machineInput = screen.getByPlaceholderText(/la marzocco/i);
    await userEvent.type(machineInput, 'NonExistent');

    await waitFor(() => {
      expect(screen.getByText(/no records found/i)).toBeInTheDocument();
    });
  });

  it('should search by multiple criteria', async () => {
    (mockedBeansApi.getAll as jest.Mock).mockResolvedValue([]);
    (mockedRecordsApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<Search />);

    const beanVarietyInput = screen.getByPlaceholderText(/blue mountain/i);
    const machineInput = screen.getByPlaceholderText(/la marzocco/i);
    const grinderInput = screen.getByPlaceholderText(/eureka/i);
    await userEvent.type(beanVarietyInput, 'Ethiopian');
    await userEvent.type(machineInput, 'La Marzocco');
    await userEvent.type(grinderInput, 'Eureka');

    await waitFor(() => {
      expect(mockedRecordsApi.getAll as jest.Mock).toHaveBeenCalled();
    }, { timeout: 2000 });
    
    // Check the call was made with correct params
    const calls = (mockedRecordsApi.getAll as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toMatchObject(expect.objectContaining({
      bean_variety: 'Ethiopian',
      machine: 'La Marzocco',
      grinder: 'Eureka',
    }));
  });
});
