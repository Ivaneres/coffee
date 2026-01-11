import React from 'react';
import { useNavigate } from 'react-router-dom';
import { recordsApi, EspressoRecord } from '../api/records';
import './RecordCard.css';

interface RecordCardProps {
  record: EspressoRecord;
  onDelete: () => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/beans/${record.bean_id}/edit-record/${record.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    try {
      await recordsApi.delete(record.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="record-card">
      <div className="card-header">
        <h3>{formatDate(record.created_at)}</h3>
        <div className="card-actions">
          <button onClick={handleEdit} className="btn-icon">
            ✏️
          </button>
          <button onClick={handleDelete} className="btn-icon">
            🗑️
          </button>
        </div>
      </div>

      <div className="record-info">
        <p><strong>Machine:</strong> {record.machine}</p>
        <p><strong>Grinder:</strong> {record.grinder}</p>
        {record.grind_size && <p><strong>Grind Size:</strong> {record.grind_size}</p>}
        {record.dose && <p><strong>Dose:</strong> {record.dose}g</p>}
        {record.extraction_time && (
          <p><strong>Extraction Time:</strong> {record.extraction_time}s</p>
        )}
        {record.yield_amount && (
          <p><strong>Yield:</strong> {record.yield_amount}g</p>
        )}
      </div>

      {(typeof record.rating === 'number' || typeof record.sourness === 'number' || typeof record.bitterness === 'number' || typeof record.sweetness === 'number') && (
        <div className="rating-display">
          {typeof record.rating === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Overall</span>
              <span className="rating-value">{record.rating}</span>
            </div>
          )}
          {typeof record.sourness === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Sourness</span>
              <span className="rating-value">{record.sourness}</span>
            </div>
          )}
          {typeof record.bitterness === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Bitterness</span>
              <span className="rating-value">{record.bitterness}</span>
            </div>
          )}
          {typeof record.sweetness === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Sweetness</span>
              <span className="rating-value">{record.sweetness}</span>
            </div>
          )}
        </div>
      )}

      {record.notes && (
        <div className="record-notes">
          <p><strong>Notes:</strong></p>
          <p>{record.notes}</p>
        </div>
      )}
    </div>
  );
};

export default RecordCard;
