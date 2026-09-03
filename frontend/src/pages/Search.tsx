import React, { useState, useEffect } from 'react';
import { recordsApi, EspressoRecord } from '../api/records';
import { beansApi, Bean } from '../api/beans';
import RecordCard from '../components/RecordCard';
import { IconSearch } from '../components/Icons';
import './Search.css';

const Search: React.FC = () => {
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
      setBeans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load beans:', error);
    }
  };

  const performSearch = async () => {
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
      setRecords(Array.isArray(data) ? data : []);
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

  const beanMap = new Map(beans.map((bean) => [bean.id, bean]));
  const hasCriteria = Object.values(searchParams).some((v) => v.trim());

  return (
    <div className="search-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Search Records</h1>
          <p className="page-subtitle">
            Find guidance for your bean, machine, and grinder combination
          </p>
        </div>
      </div>

      <div className="card search-filters-card">
        <h2 className="form-section-title">Filters</h2>
        <div className="search-filters">
          <div className="form-group">
            <label htmlFor="search-variety">Bean Variety</label>
            <input
              id="search-variety"
              type="text"
              placeholder="e.g., Blue Mountain"
              value={searchParams.bean_variety}
              onChange={(e) => setSearchParams({ ...searchParams, bean_variety: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="search-roaster">Roaster</label>
            <input
              id="search-roaster"
              type="text"
              placeholder="e.g., Somewhere in SG"
              value={searchParams.bean_roaster}
              onChange={(e) => setSearchParams({ ...searchParams, bean_roaster: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="search-machine">Machine</label>
            <input
              id="search-machine"
              type="text"
              placeholder="e.g., La Marzocco Linea Mini"
              value={searchParams.machine}
              onChange={(e) => setSearchParams({ ...searchParams, machine: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="search-grinder">Grinder</label>
            <input
              id="search-grinder"
              type="text"
              placeholder="e.g., Eureka Mignon Specialità"
              value={searchParams.grinder}
              onChange={(e) => setSearchParams({ ...searchParams, grinder: e.target.value })}
            />
          </div>
        </div>
      </div>

      <section className="search-results">
        <div className="search-results-header">
          <h2>Results</h2>
          {records.length > 0 && (
            <span className="results-count">
              {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="loading-state">Searching…</div>
        ) : records.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <IconSearch size={32} />
            </div>
            <h3>{hasCriteria ? 'No matches' : 'Start searching'}</h3>
            <p>
              {hasCriteria
                ? 'No records found matching your criteria.'
                : 'Enter at least one filter above to find matching shots.'}
            </p>
          </div>
        ) : (
          <div className="records-grid">
            {records.map((record) => {
              const bean = beanMap.get(record.bean_id);
              return (
                <div key={record.id} className="search-record-wrapper">
                  {bean && (
                    <div className="record-bean-chip">
                      <strong>{bean.variety}</strong>
                      {bean.roaster && <span> · {bean.roaster}</span>}
                    </div>
                  )}
                  <RecordCard record={record} onDelete={handleRecordDeleted} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Search;
