import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { beansApi, Bean } from '../api/beans';
import { recordsApi, EspressoRecord } from '../api/records';
import RecordCard from '../components/RecordCard';
import SearchBar from '../components/SearchBar';
import { IconBack, IconPlus, IconTrash } from '../components/Icons';
import './BeanDetail.css';

const BeanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bean, setBean] = useState<Bean | null>(null);
  const [records, setRecords] = useState<EspressoRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EspressoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState({
    machine: '',
    grinder: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    filterRecords();
  }, [records, searchParams]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [beanData, recordsData] = await Promise.all([
        beansApi.getById(parseInt(id)),
        recordsApi.getAll({ bean_id: parseInt(id) }),
      ]);
      setBean(beanData);
      setRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/beans');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];
    if (searchParams.machine) {
      filtered = filtered.filter((r) =>
        r.machine.toLowerCase().includes(searchParams.machine.toLowerCase())
      );
    }
    if (searchParams.grinder) {
      filtered = filtered.filter((r) =>
        r.grinder.toLowerCase().includes(searchParams.grinder.toLowerCase())
      );
    }
    setFilteredRecords(filtered);
  };

  const handleRecordDeleted = () => {
    loadData();
  };

  const handleDeleteBean = async () => {
    if (!bean || !window.confirm('Are you sure you want to delete this bean?')) {
      return;
    }
    try {
      await beansApi.delete(bean.id);
      navigate('/beans');
    } catch (error) {
      console.error('Failed to delete bean:', error);
      alert('Failed to delete bean');
    }
  };

  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }

  if (!bean) {
    return <div className="loading-state">Bean not found</div>;
  }

  const filtersActive = Boolean(searchParams.machine || searchParams.grinder);

  return (
    <div className="bean-detail-page">
      <div className="bean-detail-toolbar">
        <button type="button" onClick={() => navigate('/beans')} className="back-link">
          <IconBack size={20} />
          Home
        </button>
        <button type="button" onClick={handleDeleteBean} className="btn-icon-text danger" aria-label="Delete bean">
          <IconTrash size={18} />
          <span className="btn-icon-text-label">Delete</span>
        </button>
      </div>

      <header className="bean-summary">
        <h1 className="page-title">{bean.variety}</h1>
        <div className="bean-summary-meta">
          {bean.roaster && (
            <div className="bean-summary-item">
              <span className="label">Roaster</span>
              <span>{bean.roaster}</span>
            </div>
          )}
          {bean.seller && (
            <div className="bean-summary-item">
              <span className="label">Seller</span>
              <span>{bean.seller}</span>
            </div>
          )}
          {bean.roast_level && (
            <div className="bean-summary-item">
              <span className="label">Roast</span>
              <span
                className={`roast-badge ${bean.roast_level.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {bean.roast_level}
              </span>
            </div>
          )}
        </div>
      </header>

      <section className="records-section">
        <div className="records-section-header">
          <div>
            <h2>Shots</h2>
            {records.length > 0 && (
              <p className="records-count">
                {filteredRecords.length}
                {filtersActive ? ` of ${records.length}` : ''} shot
                {filteredRecords.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/beans/${id}/add-record`)}
            className="btn btn-primary"
          >
            <IconPlus size={18} />
            Log shot
          </button>
        </div>

        {records.length > 0 && (
          <div className="filters-block">
            <button
              type="button"
              className={`filters-toggle${showFilters || filtersActive ? ' active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide filters' : filtersActive ? 'Filters on' : 'Filter by equipment'}
            </button>
            {(showFilters || filtersActive) && (
              <SearchBar searchParams={searchParams} onSearchChange={setSearchParams} />
            )}
          </div>
        )}

        {filteredRecords.length === 0 ? (
          <div className="card empty-state">
            <h3>{records.length === 0 ? 'No records yet' : 'No matching records'}</h3>
            <p>
              {records.length === 0
                ? 'Log your first espresso shot for this bean.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="records-grid">
            {filteredRecords.map((record) => (
              <RecordCard key={record.id} record={record} onDelete={handleRecordDeleted} />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        className="fab-add-record"
        onClick={() => navigate(`/beans/${id}/add-record`)}
        aria-label="Log shot"
      >
        <IconPlus size={24} />
      </button>
    </div>
  );
};

export default BeanDetail;
