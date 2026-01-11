import React from 'react';
import './SearchBar.css';

interface SearchParams {
  machine: string;
  grinder: string;
}

interface SearchBarProps {
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchParams, onSearchChange }) => {
  const handleChange = (field: keyof SearchParams, value: string) => {
    onSearchChange({ ...searchParams, [field]: value });
  };

  return (
    <div className="search-bar">
      <div className="search-inputs">
        <input
          type="text"
          placeholder="Search by machine..."
          value={searchParams.machine}
          onChange={(e) => handleChange('machine', e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by grinder..."
          value={searchParams.grinder}
          onChange={(e) => handleChange('grinder', e.target.value)}
        />
      </div>
    </div>
  );
};

export default SearchBar;
