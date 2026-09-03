import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { beansApi, Bean } from '../api/beans';
import { recordsApi, EspressoRecordCreate, EspressoRecord, EspressoRecordUpdate } from '../api/records';
import { settingsApi } from '../api/settings';
import { extractErrorMessage } from '../utils/errorHandler';
import { IconBack, IconClose, IconMinus, IconPlus } from '../components/Icons';
import './AddRecord.css';

const LAST_BEAN_KEY = 'espresso-tracker:lastBeanId';

type WizardStep = 'dose' | 'time' | 'grind' | 'yield' | 'finish';

const STEPS: WizardStep[] = ['dose', 'time', 'grind', 'yield', 'finish'];

const STEP_META: Record<
  Exclude<WizardStep, 'finish'>,
  { title: string; hint: string; unit: string; step: number }
> = {
  dose: { title: 'Dose', hint: 'Coffee in the basket', unit: 'g', step: 0.1 },
  time: { title: 'Time', hint: 'Extraction length', unit: 's', step: 1 },
  grind: { title: 'Grind', hint: 'Setting on your grinder', unit: '', step: 0.1 },
  yield: { title: 'Yield', hint: 'Liquid in the cup', unit: 'g', step: 0.1 },
};

const roundToStep = (value: number, step: number) => {
  const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const AddRecord: React.FC = () => {
  const { id, recordId } = useParams<{ id: string; recordId?: string }>();
  const navigate = useNavigate();
  const [bean, setBean] = useState<Bean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [editEquipment, setEditEquipment] = useState(false);
  const [showTaste, setShowTaste] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const isEditMode = !!recordId;
  const step = STEPS[stepIndex];

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
      const beanId = parseInt(id);
      const promises: Promise<any>[] = [
        beansApi.getById(beanId),
        settingsApi.get(),
      ];

      if (recordId) {
        promises.push(recordsApi.getById(parseInt(recordId)));
      } else {
        promises.push(recordsApi.getAll({ bean_id: beanId }));
      }

      const results = await Promise.all(promises);
      const beanData = results[0];
      const settingsData = results[1];

      setBean(beanData);

      if (recordId && results[2]) {
        const recordData = results[2] as EspressoRecord;
        setFormData({
          bean_id: recordData.bean_id,
          machine: recordData.machine,
          grinder: recordData.grinder,
          grind_size: recordData.grind_size || '',
          dose: recordData.dose,
          extraction_time:
            recordData.extraction_time != null
              ? Math.round(recordData.extraction_time)
              : undefined,
          yield_amount: recordData.yield_amount,
          rating: recordData.rating ?? 5,
          sourness: recordData.sourness ?? 5,
          bitterness: recordData.bitterness ?? 5,
          sweetness: recordData.sweetness ?? 5,
          notes: recordData.notes || '',
        });
        setEditEquipment(false);
        setShowTaste(true);
        setShowNotes(Boolean(recordData.notes));
        setStepIndex(0);
      } else {
        const history = Array.isArray(results[2]) ? (results[2] as EspressoRecord[]) : [];
        const last = history.length
          ? [...history].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : null;

        const machine = last?.machine || settingsData?.default_machine || '';
        const grinder = last?.grinder || settingsData?.default_grinder || '';
        const dose =
          last?.dose ??
          (settingsData?.default_dose != null ? settingsData.default_dose : undefined);

        setFormData((prev) => ({
          ...prev,
          machine,
          grinder,
          dose,
          grind_size: last?.grind_size || '',
          extraction_time:
            last?.extraction_time != null ? Math.round(last.extraction_time) : undefined,
          yield_amount: last?.yield_amount,
          rating: 5,
          sourness: 5,
          bitterness: 5,
          sweetness: 5,
        }));
        setEditEquipment(!(machine && grinder));
        setStepIndex(0);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      navigate('/beans');
    } finally {
      setLoading(false);
    }
  };

  const saveRecord = async () => {
    setError('');
    setSubmitting(true);

    try {
      const data: EspressoRecordCreate = {
        ...formData,
        grind_size: formData.grind_size || undefined,
        dose: formData.dose || undefined,
        extraction_time: formData.extraction_time || undefined,
        yield_amount: formData.yield_amount || undefined,
        rating: formData.rating,
        sourness: formData.sourness,
        bitterness: formData.bitterness,
        sweetness: formData.sweetness,
        notes: formData.notes || undefined,
      };

      if (!data.machine || !data.grinder) {
        setError('Machine and grinder are required');
        setEditEquipment(true);
        setSubmitting(false);
        return;
      }

      if (isEditMode && recordId) {
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
        await recordsApi.create(data);
        if (id) localStorage.setItem(LAST_BEAN_KEY, id);
      }
      navigate(`/beans/${id}`);
    } catch (err: any) {
      setError(extractErrorMessage(err) || `Failed to ${isEditMode ? 'update' : 'create'} record`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 'finish') {
      goNext();
      return;
    }
    await saveRecord();
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => {
    if (stepIndex === 0) {
      navigate(`/beans/${id}`);
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const updateRating = (field: 'rating' | 'sourness' | 'bitterness' | 'sweetness', value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const bumpNumeric = (
    field: 'dose' | 'extraction_time' | 'yield_amount',
    direction: 1 | -1,
    stepSize: number
  ) => {
    const current = formData[field] ?? 0;
    const next = roundToStep(current + direction * stepSize, stepSize);
    setFormData({ ...formData, [field]: next < 0 ? 0 : next });
  };

  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }

  if (!bean) {
    return <div className="loading-state">Bean not found</div>;
  }

  const hasEquipment = Boolean(formData.machine && formData.grinder);
  const showEquipmentFields = editEquipment || !hasEquipment;

  const renderNumericStep = (
    field: 'dose' | 'extraction_time' | 'yield_amount',
    meta: (typeof STEP_META)['dose']
  ) => {
    const value = formData[field];
    return (
      <div className="wizard-step" key={field}>
        <p className="wizard-step-kicker">{bean.variety}</p>
        <h1 className="wizard-step-title">{meta.title}</h1>
        <p className="wizard-step-hint">{meta.hint}</p>
        <div className="wizard-value-row">
          <button
            type="button"
            className="wizard-bump"
            aria-label={`Decrease ${meta.title}`}
            onClick={() => bumpNumeric(field, -1, meta.step)}
          >
            <IconMinus size={28} />
          </button>
          <div className="wizard-value-block">
            <input
              id={field === 'extraction_time' ? 'extraction-time' : field === 'yield_amount' ? 'yield' : 'dose'}
              className="wizard-value-input"
              type="number"
              inputMode={field === 'extraction_time' ? 'numeric' : 'decimal'}
              step={meta.step}
              value={value ?? ''}
              placeholder="—"
              aria-label={meta.title}
              onChange={(e) => {
                if (e.target.value === '') {
                  setFormData({ ...formData, [field]: undefined });
                  return;
                }
                const parsed =
                  field === 'extraction_time'
                    ? parseInt(e.target.value, 10)
                    : parseFloat(e.target.value);
                setFormData({
                  ...formData,
                  [field]: Number.isNaN(parsed) ? undefined : parsed,
                });
              }}
            />
            {meta.unit && <span className="wizard-unit">{meta.unit}</span>}
          </div>
          <button
            type="button"
            className="wizard-bump"
            aria-label={`Increase ${meta.title}`}
            onClick={() => bumpNumeric(field, 1, meta.step)}
          >
            <IconPlus size={28} />
          </button>
        </div>
        <div className="wizard-quick-row">
          {field === 'dose' &&
            [16, 18, 18.5, 20].map((n) => (
              <button
                key={n}
                type="button"
                className={`wizard-chip${value === n ? ' active' : ''}`}
                onClick={() => setFormData({ ...formData, dose: n })}
              >
                {n}g
              </button>
            ))}
          {field === 'extraction_time' &&
            [25, 28, 30, 32].map((n) => (
              <button
                key={n}
                type="button"
                className={`wizard-chip${value === n ? ' active' : ''}`}
                onClick={() => setFormData({ ...formData, extraction_time: n })}
              >
                {n}s
              </button>
            ))}
          {field === 'yield_amount' &&
            [32, 36, 40, 45].map((n) => (
              <button
                key={n}
                type="button"
                className={`wizard-chip${value === n ? ' active' : ''}`}
                onClick={() => setFormData({ ...formData, yield_amount: n })}
              >
                {n}g
              </button>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="wizard-shell" role="dialog" aria-modal="true" aria-label={isEditMode ? 'Edit shot' : 'Log shot'}>
      <header className="wizard-header">
        <button type="button" className="wizard-icon-btn" onClick={goBack} aria-label={stepIndex === 0 ? 'Close' : 'Back'}>
          {stepIndex === 0 ? <IconClose size={22} /> : <IconBack size={22} />}
        </button>
        <div className="wizard-progress" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`wizard-dot${i === stepIndex ? ' active' : ''}${i < stepIndex ? ' done' : ''}`} />
          ))}
        </div>
        <button
          type="button"
          className="wizard-text-btn"
          onClick={() => navigate(`/beans/${id}`)}
        >
          Cancel
        </button>
      </header>

      {error && <div className="error-message wizard-error">{error}</div>}

      <form onSubmit={handleSubmit} className="wizard-body">
        <p className="sr-only">{isEditMode ? 'Edit shot wizard' : 'Log shot wizard'}</p>

        {step === 'dose' && renderNumericStep('dose', STEP_META.dose)}
        {step === 'time' && renderNumericStep('extraction_time', STEP_META.time)}
        {step === 'grind' && (
          <div className="wizard-step">
            <p className="wizard-step-kicker">{bean.variety}</p>
            <h1 className="wizard-step-title">Grind</h1>
            <p className="wizard-step-hint">Setting on your grinder</p>
            <input
              id="grind-size"
              className="wizard-grind-input"
              type="text"
              inputMode="decimal"
              value={formData.grind_size}
              onChange={(e) => setFormData({ ...formData, grind_size: e.target.value })}
              placeholder="e.g. 5.2"
              aria-label="Grind Size"
              autoFocus
            />
            <div className="wizard-quick-row">
              {['4', '5', '5.5', '6', '7'].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`wizard-chip${formData.grind_size === n ? ' active' : ''}`}
                  onClick={() => setFormData({ ...formData, grind_size: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 'yield' && renderNumericStep('yield_amount', STEP_META.yield)}

        {step === 'finish' && (
          <div className="wizard-step wizard-finish">
            <p className="wizard-step-kicker">{bean.variety}</p>
            <h1 className="wizard-step-title">{isEditMode ? 'Edit shot' : 'Save shot'}</h1>
            <p className="wizard-step-hint">Confirm numbers, then save</p>

            <ul className="wizard-summary">
              <li>
                <button type="button" onClick={() => setStepIndex(0)}>
                  <span>Dose</span>
                  <strong>{formData.dose != null ? `${formData.dose}g` : '—'}</strong>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setStepIndex(1)}>
                  <span>Time</span>
                  <strong>{formData.extraction_time != null ? `${formData.extraction_time}s` : '—'}</strong>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setStepIndex(2)}>
                  <span>Grind</span>
                  <strong>{formData.grind_size || '—'}</strong>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setStepIndex(3)}>
                  <span>Yield</span>
                  <strong>{formData.yield_amount != null ? `${formData.yield_amount}g` : '—'}</strong>
                </button>
              </li>
            </ul>

            <section className="wizard-panel">
              {!showEquipmentFields ? (
                <div className="equipment-chips">
                  <div className="equipment-chip-row">
                    <span className="equipment-chip">{formData.machine}</span>
                    <span className="equipment-chip-sep">·</span>
                    <span className="equipment-chip">{formData.grinder}</span>
                  </div>
                  <button type="button" className="btn-ghost equipment-edit" onClick={() => setEditEquipment(true)}>
                    Edit
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="wizard-panel-title">Equipment</h2>
                  <div className="form-group">
                    <label htmlFor="machine">Machine *</label>
                    <input
                      id="machine"
                      type="text"
                      value={formData.machine}
                      onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="grinder">Grinder *</label>
                    <input
                      id="grinder"
                      type="text"
                      value={formData.grinder}
                      onChange={(e) => setFormData({ ...formData, grinder: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </div>
                  {hasEquipment && (
                    <button type="button" className="btn btn-secondary btn-block" onClick={() => setEditEquipment(false)}>
                      Done
                    </button>
                  )}
                </>
              )}
              {!showEquipmentFields && (
                <div className="sr-only" aria-hidden>
                  <input id="machine" value={formData.machine} required readOnly tabIndex={-1} />
                  <input id="grinder" value={formData.grinder} required readOnly tabIndex={-1} />
                </div>
              )}
            </section>

            <button
              type="button"
              className={`disclosure-toggle wizard-disclosure${showTaste ? ' open' : ''}`}
              onClick={() => setShowTaste(!showTaste)}
              aria-expanded={showTaste}
            >
              <span>Rate this shot</span>
              <span className="disclosure-chevron" aria-hidden>
                ▾
              </span>
            </button>
            {showTaste && (
              <div className="ratings-section wizard-panel">
                <div className="ratings-grid">
                  {(
                    [
                      ['rating', 'Overall', formData.rating],
                      ['sourness', 'Sourness', formData.sourness],
                      ['bitterness', 'Bitterness', formData.bitterness],
                      ['sweetness', 'Sweetness', formData.sweetness],
                    ] as const
                  ).map(([field, label, value]) => (
                    <div className="rating-input" key={field}>
                      <div className="rating-input-header">
                        <label htmlFor={field}>{label}</label>
                        <span className="rating-input-value">{value || 5}</span>
                      </div>
                      <input
                        id={field}
                        type="range"
                        min="1"
                        max="10"
                        value={value || 5}
                        onChange={(e) => updateRating(field, parseInt(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className={`disclosure-toggle wizard-disclosure${showNotes ? ' open' : ''}`}
              onClick={() => setShowNotes(!showNotes)}
              aria-expanded={showNotes}
            >
              <span>Notes</span>
              <span className="disclosure-chevron" aria-hidden>
                ▾
              </span>
            </button>
            {showNotes && (
              <div className="form-group notes-group wizard-panel">
                <label htmlFor="notes" className="sr-only">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anything memorable about this shot…"
                />
              </div>
            )}
          </div>
        )}

        <div className="wizard-footer">
          {step === 'finish' ? (
            <button type="submit" className="btn btn-primary wizard-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Save shot'}
            </button>
          ) : (
            <>
              <button type="submit" className="btn btn-primary wizard-primary">
                Next
              </button>
              <button type="button" className="btn btn-ghost wizard-skip" onClick={goNext}>
                Skip
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddRecord;
