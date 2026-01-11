import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { beansApi, Bean } from '../api/beans';
import { recordsApi, EspressoRecordCreate, EspressoRecord, EspressoRecordUpdate } from '../api/records';
import { settingsApi, UserSettings } from '../api/settings';
import { extractErrorMessage } from '../utils/errorHandler';
import './AddRecord.css';

const AddRecord: React.FC = () => {
  const { id, recordId } = useParams<{ id: string; recordId?: string }>();
  const navigate = useNavigate();
  const [bean, setBean] = useState<Bean | null>(null);
  const [record, setRecord] = useState<EspressoRecord | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!recordId;
  
  const [formData, setFormData] = useState<EspressoRecordCreate>({
    bean_id: parseInt(id || '0'),
    machine: '',
    grinder: '',
    grind_size: '',
    dose: undefined,
    extraction_time: undefined,
    yield_amount: undefined,
    rating: 5,
    sourness: 5,
    bitterness: 5,
    sweetness: 5,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, recordId]);

  const loadData = async () => {
    if (!id) return;
    try {
      const promises: Promise<any>[] = [
        beansApi.getById(parseInt(id)),
        settingsApi.get(),
      ];
      
      // If editing, load the record
      if (recordId) {
        promises.push(recordsApi.getById(parseInt(recordId)));
      }
      
      const results = await Promise.all(promises);
      const beanData = results[0];
      const settingsData = results[1];
      
      setBean(beanData);
      setUserSettings(settingsData);
      
      if (recordId && results[2]) {
        // Edit mode - load existing record data
        const recordData = results[2] as EspressoRecord;
        setRecord(recordData);
        setFormData({
          bean_id: recordData.bean_id,
          machine: recordData.machine,
          grinder: recordData.grinder,
          grind_size: recordData.grind_size || '',
          dose: recordData.dose,
          extraction_time: recordData.extraction_time,
          yield_amount: recordData.yield_amount,
          rating: recordData.rating ?? 5,
          sourness: recordData.sourness ?? 5,
          bitterness: recordData.bitterness ?? 5,
          sweetness: recordData.sweetness ?? 5,
          notes: recordData.notes || '',
        });
      } else {
        // Create mode - use defaults
        setFormData(prev => ({
          ...prev,
          machine: settingsData.default_machine || '',
          grinder: settingsData.default_grinder || '',
          rating: 5,
          sourness: 5,
          bitterness: 5,
          sweetness: 5,
        }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/beans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Convert empty strings to undefined for optional fields
      // Keep rating values as numbers (they default to 5, so don't convert to undefined)
      const data: EspressoRecordCreate = {
        ...formData,
        grind_size: formData.grind_size || undefined,
        dose: formData.dose || undefined,
        extraction_time: formData.extraction_time || undefined,
        yield_amount: formData.yield_amount || undefined,
        rating: formData.rating, // Keep as number (defaults to 5)
        sourness: formData.sourness, // Keep as number (defaults to 5)
        bitterness: formData.bitterness, // Keep as number (defaults to 5)
        sweetness: formData.sweetness, // Keep as number (defaults to 5)
        notes: formData.notes || undefined,
      };
      
      if (isEditMode && recordId) {
        // Update existing record - exclude bean_id from update
        const updateData: EspressoRecordUpdate = {
          machine: data.machine,
          grinder: data.grinder,
          grind_size: data.grind_size,
          dose: data.dose,
          extraction_time: data.extraction_time,
          yield_amount: data.yield_amount,
          rating: data.rating,
          sourness: data.sourness,
          bitterness: data.bitterness,
          sweetness: data.sweetness,
          notes: data.notes,
        };
        await recordsApi.update(parseInt(recordId), updateData);
      } else {
        // Create new record
        await recordsApi.create(data);
      }
      navigate(`/beans/${id}`);
    } catch (err: any) {
      setError(extractErrorMessage(err) || `Failed to ${isEditMode ? 'update' : 'create'} record`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRating = (field: 'rating' | 'sourness' | 'bitterness' | 'sweetness', value: number) => {
    setFormData({ ...formData, [field]: value });
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
        <div>
          <button onClick={() => navigate(`/beans/${id}`)} className="btn btn-secondary">
            ← Back to Bean
          </button>
        </div>
        <h1>{isEditMode ? 'Edit' : 'Add'} Record - {bean.variety}</h1>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="card">
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
              <label>Dose (grams)</label>
              <input
                type="number"
                step="0.1"
                value={formData.dose || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dose: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 18.0"
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
            <button type="button" onClick={() => navigate(`/beans/${id}`)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Record' : 'Create Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecord;
