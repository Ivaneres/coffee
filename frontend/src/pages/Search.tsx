import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordsApi, EspressoRecord } from '../api/records';
import { beansApi, Bean } from '../api/beans';
import RecordCard from '../components/RecordCard';
import './Search.css';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<EspressoRecord[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    bean_variety: '',
    bean_roaster: '',
    machine: '',
    grinder: '',
  });

  useEffect(() => {
    loadBeans();
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const loadBeans = async () => {
    try {
      const data = await beansApi.getAll();
      setBeans(data);
    } catch (error) {
      console.error('Failed to load beans:', error);
    }
  };

  const performSearch = async () => {
    // Only search if at least one parameter is provided
    const hasSearchParams = 
      searchParams.bean_variety.trim() ||
      searchParams.bean_roaster.trim() ||
      searchParams.machine.trim() ||
      searchParams.grinder.trim();

    if (!hasSearchParams) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const params: any = {};
      if (searchParams.machine.trim()) {
        params.machine = searchParams.machine.trim();
      }
      if (searchParams.grinder.trim()) {
        params.grinder = searchParams.grinder.trim();
      }
      if (searchParams.bean_variety.trim()) {
        params.bean_variety = searchParams.bean_variety.trim();
      }
      if (searchParams.bean_roaster.trim()) {
        params.bean_roaster = searchParams.bean_roaster.trim();
      }

      const data = await recordsApi.getAll(params);
      setRecords(data);
    } catch (error) {
      console.error('Failed to search records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDeleted = () => {
    performSearch();
  };

  // Create a map of bean_id to bean for quick lookup
  const beanMap = new Map(beans.map(bean => [bean.id, bean]));

  return (
    <div>
      <div className="page-header">
        <h1>Search Records</h1>
        <p className="search-description">
          Find guidance for your specific bean, machine, and grinder combination
        </p>
      </div>

      <div className="card">
        <h2>Search Filters</h2>
        <div className="search-filters">
          <div className="form-group">
            <label>Bean Variety</label>
            <input
              type="text"
              placeholder="e.g., Blue Mountain, Ethiopian"
              value={searchParams.bean_variety}
              onChange={(e) => setSearchParams({ ...searchParams, bean_variety: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Roaster</label>
            <input
              type="text"
              placeholder="e.g., Somewhere in SG"
              value={searchParams.bean_roaster}
              onChange={(e) => setSearchParams({ ...searchParams, bean_roaster: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Machine</label>
            <input
              type="text"
              placeholder="e.g., La Marzocco Linea Mini"
              value={searchParams.machine}
              onChange={(e) => setSearchParams({ ...searchParams, machine: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Grinder</label>
            <input
              type="text"
              placeholder="e.g., Eureka Mignon Specialità"
              value={searchParams.grinder}
              onChange={(e) => setSearchParams({ ...searchParams, grinder: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Search Results</h2>
          {records.length > 0 && (
            <span className="results-count">{records.length} record{records.length !== 1 ? 's' : ''} found</span>
          )}
        </div>

        {loading ? (
          <p>Searching...</p>
        ) : records.length === 0 ? (
          <div className="empty-search">
            {Object.values(searchParams).some(v => v.trim()) ? (
              <p>No records found matching your search criteria.</p>
            ) : (
              <p>Enter search criteria above to find records matching your bean, machine, and grinder combination.</p>
            )}
          </div>
        ) : (
          <div className="records-grid">
            {records.map((record) => {
              const bean = beanMap.get(record.bean_id);
              return (
                <div key={record.id} className="search-record-wrapper">
                  {bean && (
                    <div className="record-bean-info">
                      <strong>{bean.variety}</strong>
                      {bean.roaster && <span className="bean-meta"> • {bean.roaster}</span>}
                    </div>
                  )}
                  <RecordCard
                    record={record}
                    onDelete={handleRecordDeleted}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
