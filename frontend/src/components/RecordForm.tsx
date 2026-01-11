import React, { useState } from 'react';
import { recordsApi, EspressoRecordCreate } from '../api/records';
import './RecordForm.css';

interface RecordFormProps {
  beanId: number;
  defaultMachine: string;
  defaultGrinder: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const RecordForm: React.FC<RecordFormProps> = ({
  beanId,
  defaultMachine,
  defaultGrinder,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<EspressoRecordCreate>({
    bean_id: beanId,
    machine: defaultMachine,
    grinder: defaultGrinder,
    grind_size: '',
    extraction_time: undefined,
    yield_amount: undefined,
    rating: undefined,
    sourness: undefined,
    bitterness: undefined,
    sweetness: undefined,
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert empty strings to undefined for optional fields
      const data: EspressoRecordCreate = {
        ...formData,
        grind_size: formData.grind_size || undefined,
        extraction_time: formData.extraction_time || undefined,
        yield_amount: formData.yield_amount || undefined,
        rating: formData.rating || undefined,
        sourness: formData.sourness || undefined,
        bitterness: formData.bitterness || undefined,
        sweetness: formData.sweetness || undefined,
        notes: formData.notes || undefined,
      };
      await recordsApi.create(data);
      onSuccess();
    } catch (error) {
      console.error('Failed to create record:', error);
      alert('Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRating = (field: 'rating' | 'sourness' | 'bitterness' | 'sweetness', value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="record-form">
      <div className="form-row">
        <div className="form-group">
          <label>Machine *</label>
          <input
            type="text"
            value={formData.machine}
            onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Grinder *</label>
          <input
            type="text"
            value={formData.grinder}
            onChange={(e) => setFormData({ ...formData, grinder: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Grind Size</label>
          <input
            type="text"
            value={formData.grind_size}
            onChange={(e) => setFormData({ ...formData, grind_size: e.target.value })}
            placeholder="e.g., 5, Fine, Medium"
          />
        </div>
        <div className="form-group">
          <label>Extraction Time (seconds)</label>
          <input
            type="number"
            step="0.1"
            value={formData.extraction_time || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                extraction_time: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="form-group">
          <label>Yield (grams)</label>
          <input
            type="number"
            step="0.1"
            value={formData.yield_amount || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                yield_amount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="ratings-section">
        <h3>Flavor Ratings (1-10)</h3>
        <div className="ratings-grid">
          <div className="rating-input">
            <label>Overall Rating</label>
            <div className="range-input">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.rating || 5}
                onChange={(e) => updateRating('rating', parseInt(e.target.value))}
              />
              <span>{formData.rating || 5}</span>
            </div>
          </div>
          <div className="rating-input">
            <label>Sourness</label>
            <div className="range-input">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.sourness || 5}
                onChange={(e) => updateRating('sourness', parseInt(e.target.value))}
              />
              <span>{formData.sourness || 5}</span>
            </div>
          </div>
          <div className="rating-input">
            <label>Bitterness</label>
            <div className="range-input">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.bitterness || 5}
                onChange={(e) => updateRating('bitterness', parseInt(e.target.value))}
              />
              <span>{formData.bitterness || 5}</span>
            </div>
          </div>
          <div className="rating-input">
            <label>Sweetness</label>
            <div className="range-input">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.sweetness || 5}
                onChange={(e) => updateRating('sweetness', parseInt(e.target.value))}
              />
              <span>{formData.sweetness || 5}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this shot..."
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Record'}
        </button>
      </div>
    </form>
  );
};

export default RecordForm;
