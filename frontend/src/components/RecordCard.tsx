import React from 'react';
import { useNavigate } from 'react-router-dom';
import { recordsApi, EspressoRecord } from '../api/records';
import { IconEdit, IconTrash } from './Icons';
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

  const metaItems: { label: string; value: string }[] = [
    { label: 'Machine', value: record.machine },
    { label: 'Grinder', value: record.grinder },
  ];
  if (record.grind_size) metaItems.push({ label: 'Grind', value: record.grind_size });
  if (record.dose) metaItems.push({ label: 'Dose', value: `${record.dose}g` });
  if (record.extraction_time) metaItems.push({ label: 'Time', value: `${record.extraction_time}s` });
  if (record.yield_amount) metaItems.push({ label: 'Yield', value: `${record.yield_amount}g` });

  return (
    <article className="record-card">
      <div className="record-card-header">
        <div className="record-card-title-block">
          <h3>{formatDate(record.created_at)}</h3>
          {typeof record.rating === 'number' && (
            <span className="record-rating-pill" aria-label={`Overall rating ${record.rating}`}>
              {record.rating}
              <span>/10</span>
            </span>
          )}
        </div>
        <div className="card-actions">
          <button type="button" onClick={handleEdit} className="btn-icon" aria-label="Edit record">
            <IconEdit size={20} />
          </button>
          <button type="button" onClick={handleDelete} className="btn-icon danger" aria-label="Delete record">
            <IconTrash size={20} />
          </button>
        </div>
      </div>

      <div className="record-meta-grid">
        {metaItems.map((item) => (
          <div key={item.label} className="record-meta-item">
            <span className="record-meta-label">{item.label}</span>
            <span className="record-meta-value">{item.value}</span>
          </div>
        ))}
      </div>

      {(typeof record.sourness === 'number' ||
        typeof record.bitterness === 'number' ||
        typeof record.sweetness === 'number') && (
        <div className="rating-display">
          {typeof record.sourness === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Sour</span>
              <span className="rating-value">{record.sourness}</span>
            </div>
          )}
          {typeof record.bitterness === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Bitter</span>
              <span className="rating-value">{record.bitterness}</span>
            </div>
          )}
          {typeof record.sweetness === 'number' && (
            <div className="rating-item">
              <span className="rating-label">Sweet</span>
              <span className="rating-value">{record.sweetness}</span>
            </div>
          )}
        </div>
      )}

      {record.notes && (
        <div className="record-notes">
          <p className="record-notes-label">Notes</p>
          <p>{record.notes}</p>
        </div>
      )}
    </article>
  );
};

export default RecordCard;
