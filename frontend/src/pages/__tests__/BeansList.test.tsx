import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import BeansList from '../BeansList';
import { beansApi } from '../../api/beans';

jest.mock('../../api/beans');

const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

describe('BeansList', () => {
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
    jest.mocked(beansApi.getAll).mockImplementation(() => new Promise(() => {}));

    render(<BeansList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display empty state when no beans', async () => {
    jest.mocked(beansApi.getAll).mockResolvedValue([]);

    render(<BeansList />);

    await waitFor(() => {
      expect(screen.getByText(/no beans yet/i)).toBeInTheDocument();
      expect(screen.getByText(/add your first bean/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /ready to dial in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log a shot/i })).toBeInTheDocument();
    });
  });

  it('should display list of beans', async () => {
    const mockBeans = [
      {
        id: 1,
        user_id: 1,
        variety: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        seller: 'Coffee Shop',
        roast_level: 'Light',
        created_at: '2024-01-01',
      },
      {
        id: 2,
        user_id: 1,
        variety: 'Colombian Supremo',
        roaster: 'Starbucks',
        roast_level: 'Medium',
        created_at: '2024-01-02',
      },
    ];

    jest.mocked(beansApi.getAll).mockResolvedValue(mockBeans);

    render(<BeansList />);

    await waitFor(() => {
      expect(screen.getByText('Ethiopian Yirgacheffe')).toBeInTheDocument();
      expect(screen.getByText('Colombian Supremo')).toBeInTheDocument();
      expect(screen.getByText('Blue Bottle')).toBeInTheDocument();
    });
  });

  it('should show add bean form when button is clicked', async () => {
    jest.mocked(beansApi.getAll).mockResolvedValue([]);

    render(<BeansList />);

    await waitFor(() => {
      expect(screen.getByText(/no beans yet/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add bean/i });
    await userEvent.click(addButton);

    expect(screen.getByText('Add New Bean')).toBeInTheDocument();
    expect(screen.getByText('Variety *')).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should create new bean', async () => {
    const newBean = {
      id: 1,
      user_id: 1,
      variety: 'New Bean',
      created_at: '2024-01-01',
    };
    jest.mocked(beansApi.getAll).mockResolvedValueOnce([]).mockResolvedValueOnce([newBean]);
    jest.mocked(beansApi.create).mockResolvedValue(newBean);

    render(<BeansList />);

    await waitFor(() => {
      expect(screen.getByText(/no beans yet/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add bean/i });
    await userEvent.click(addButton);

    const varietyInput = screen.getAllByRole('textbox')[0];
    await userEvent.type(varietyInput, 'New Bean');
    await userEvent.click(screen.getByRole('button', { name: /create bean/i }));

    await waitFor(() => {
      expect(beansApi.create).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(beansApi.create).toHaveBeenCalledWith({
      variety: 'New Bean',
      seller: '',
      roaster: '',
      roast_level: '',
    });
  });

  it('should cancel form when cancel button is clicked', async () => {
    jest.mocked(beansApi.getAll).mockResolvedValue([]);

    render(<BeansList />);

    await waitFor(() => {
      expect(screen.getByText(/no beans yet/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add bean/i });
    await userEvent.click(addButton);

    expect(screen.getByText('Add New Bean')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Add New Bean')).not.toBeInTheDocument();
    });
  });
});
