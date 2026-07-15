import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../test-utils';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  const mockSearchParams = {
    machine: '',
    grinder: '',
  };

  const mockOnSearchChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search inputs', () => {
    render(
      <SearchBar searchParams={mockSearchParams} onSearchChange={mockOnSearchChange} />
    );

    expect(screen.getByPlaceholderText(/search by machine/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by grinder/i)).toBeInTheDocument();
  });

  it('should display current search params', () => {
    const paramsWithValues = {
      machine: 'La Marzocco',
      grinder: 'Eureka',
    };

    render(
      <SearchBar searchParams={paramsWithValues} onSearchChange={mockOnSearchChange} />
    );

    const machineInput = screen.getByPlaceholderText(/search by machine/i) as HTMLInputElement;
    const grinderInput = screen.getByPlaceholderText(/search by grinder/i) as HTMLInputElement;

    expect(machineInput.value).toBe('La Marzocco');
    expect(grinderInput.value).toBe('Eureka');
  });
});
