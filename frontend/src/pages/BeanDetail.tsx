import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { beansApi, Bean } from '../api/beans';
import { recordsApi, EspressoRecord } from '../api/records';
import RecordCard from '../components/RecordCard';
import SearchBar from '../components/SearchBar';
import './BeanDetail.css';

const BeanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bean, setBean] = useState<Bean | null>(null);
  const [records, setRecords] = useState<EspressoRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EspressoRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
      setRecords(recordsData);
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
    return <div>Loading...</div>;
  }

  if (!bean) {
    return <div>Bean not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <button onClick={() => navigate('/beans')} className="btn btn-secondary">
          ← Back to Beans
        </button>
        <button onClick={handleDeleteBean} className="btn btn-danger">
          Delete Bean
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h1>{bean.variety}</h1>
        </div>
        <div className="bean-details">
          {bean.roaster && <p><strong>Roaster:</strong> {bean.roaster}</p>}
          {bean.seller && <p><strong>Seller:</strong> {bean.seller}</p>}
          {bean.roast_level && <p><strong>Roast Level:</strong> {bean.roast_level}</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Espresso Records</h2>
          <button onClick={() => navigate(`/beans/${id}/add-record`)} className="btn btn-primary">
            Add Record
          </button>
        </div>

        {records.length > 0 && (
          <SearchBar
            searchParams={searchParams}
            onSearchChange={setSearchParams}
          />
        )}

        {filteredRecords.length === 0 ? (
          <p>No records yet. Add your first espresso record!</p>
        ) : (
          <div className="records-grid">
            {filteredRecords.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onDelete={handleRecordDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeanDetail;
