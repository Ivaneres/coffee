import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import RecordCard from '../RecordCard';
import { recordsApi } from '../../api/records';

jest.mock('../../api/records');

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

    expect(screen.getByLabelText(/overall rating 8/i)).toBeInTheDocument();
    expect(screen.getByText('Sour')).toBeInTheDocument();
    expect(screen.getByText('Bitter')).toBeInTheDocument();
    expect(screen.getByText('Sweet')).toBeInTheDocument();
    const ratingValues = screen.getAllByText('8');
    expect(ratingValues.length).toBeGreaterThan(0);
  });

  it('should navigate to edit page when edit button is clicked', async () => {
    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    const editButton = screen.getByRole('button', { name: /edit record/i });
    await userEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/beans/1/edit-record/1');
  });

  it('should delete record when delete button is clicked and confirmed', async () => {
    jest.mocked(recordsApi.delete).mockResolvedValue(undefined);

    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete record/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(recordsApi.delete).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  it('should not delete record when delete is cancelled', async () => {
    window.confirm = jest.fn(() => false);

    render(<RecordCard record={mockRecord} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete record/i });
    await userEvent.click(deleteButton);

    expect(recordsApi.delete).not.toHaveBeenCalled();
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

    const dateElement = screen.getByText(/jan/i);
    expect(dateElement).toBeInTheDocument();
  });
});
