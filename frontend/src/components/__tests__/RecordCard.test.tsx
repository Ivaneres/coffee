import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import RecordCard from '../RecordCard';
import * as recordsApi from '../../api/records';

jest.mock('../../api/records');
const mockedRecordsApi = recordsApi as jest.Mocked<typeof recordsApi>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RecordCard', () => {
  const mockRecord = {
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
    sourness: 7,
    bitterness: 6,
    sweetness: 8,
    notes: 'Great shot!',
    created_at: '2024-01-01T10:00:00Z',
  };

  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    // Ensure mocks are set up
    (mockedRecordsApi.delete as jest.Mock) = jest.fn();
  });

  it('should display record information', () => {
    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    expect(screen.getByText('La Marzocco')).toBeInTheDocument();
    expect(screen.getByText('Eureka')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('18g')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('36g')).toBeInTheDocument();
    expect(screen.getByText('Great shot!')).toBeInTheDocument();
  });

  it('should display ratings', () => {
    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    expect(screen.getByText('Overall')).toBeInTheDocument();
    expect(screen.getByText('Sourness')).toBeInTheDocument();
    expect(screen.getByText('Bitterness')).toBeInTheDocument();
    expect(screen.getByText('Sweetness')).toBeInTheDocument();
    // Check for rating values using getAllByText since there are multiple 8s
    const ratingValues = screen.getAllByText('8');
    expect(ratingValues.length).toBeGreaterThan(0);
  });

  it('should navigate to edit page when edit button is clicked', async () => {
    
    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    const editButton = screen.getByRole('button', { name: /✏️/i });
    await userEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/beans/1/edit-record/1');
  });

  it('should delete record when delete button is clicked and confirmed', async () => {
    (mockedRecordsApi.delete as jest.Mock).mockResolvedValue(undefined);

    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /🗑️/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedRecordsApi.delete as jest.Mock).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  it('should not delete record when delete is cancelled', async () => {
    
    window.confirm = jest.fn(() => false);

    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /🗑️/i });
    await userEvent.click(deleteButton);

    expect(mockedRecordsApi.delete as jest.Mock).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should handle optional fields gracefully', () => {
    const minimalRecord = {
      id: 2,
      user_id: 1,
      bean_id: 1,
      machine: 'La Marzocco',
      grinder: 'Eureka',
      created_at: '2024-01-01T10:00:00Z',
    };

    render(<RecordCard record={minimalRecord} onDelete={mockOnDelete} />);

    expect(screen.getByText('La Marzocco')).toBeInTheDocument();
    expect(screen.getByText('Eureka')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    // The date should be formatted and displayed
    const dateElement = screen.getByText(/jan/i);
    expect(dateElement).toBeInTheDocument();
  });
});
