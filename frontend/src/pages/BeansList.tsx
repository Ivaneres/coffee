import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { beansApi, Bean } from '../api/beans';
import { IconChevronRight, IconClose, IconCup, IconPlus } from '../components/Icons';
import './BeansList.css';

const LAST_BEAN_KEY = 'espresso-tracker:lastBeanId';

const BeansList: React.FC = () => {
  const navigate = useNavigate();
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [beanQuery, setBeanQuery] = useState('');
  const [pickerQuery, setPickerQuery] = useState('');
  const [formData, setFormData] = useState({
    variety: '',
    seller: '',
    roaster: '',
    roast_level: '',
  });

  useEffect(() => {
    loadBeans();
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    setPickerQuery('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    window.addEventListener('keydown', onKey);

    // Keep the sheet inside the visible viewport while the mobile keyboard is open.
    const root = document.documentElement;
    const vv = window.visualViewport;
    const syncViewport = () => {
      if (!vv) {
        root.style.setProperty('--picker-vv-height', '100dvh');
        root.style.setProperty('--picker-vv-offset-top', '0px');
        return;
      }
      root.style.setProperty('--picker-vv-height', `${vv.height}px`);
      root.style.setProperty('--picker-vv-offset-top', `${vv.offsetTop}px`);
    };
    syncViewport();
    vv?.addEventListener('resize', syncViewport);
    vv?.addEventListener('scroll', syncViewport);

    return () => {
      window.removeEventListener('keydown', onKey);
      vv?.removeEventListener('resize', syncViewport);
      vv?.removeEventListener('scroll', syncViewport);
      root.style.removeProperty('--picker-vv-height');
      root.style.removeProperty('--picker-vv-offset-top');
    };
  }, [showPicker]);

  const lastBeanId = useMemo(() => {
    const raw = localStorage.getItem(LAST_BEAN_KEY);
    return raw ? parseInt(raw, 10) : null;
  }, [showPicker, beans]);

  const matchesQuery = (bean: Bean, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [bean.variety, bean.roaster, bean.seller, bean.roast_level]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  };

  const filteredBeans = useMemo(
    () => beans.filter((b) => matchesQuery(b, beanQuery)),
    [beans, beanQuery]
  );

  const sortedForPicker = useMemo(() => {
    const filtered = beans.filter((b) => matchesQuery(b, pickerQuery));
    if (!lastBeanId) return filtered;
    const last = filtered.find((b) => b.id === lastBeanId);
    if (!last) return filtered;
    return [last, ...filtered.filter((b) => b.id !== lastBeanId)];
  }, [beans, lastBeanId, pickerQuery]);

  const loadBeans = async () => {
    try {
      const data = await beansApi.getAll();
      setBeans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load beans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await beansApi.create(formData);
      setShowForm(false);
      setFormData({ variety: '', seller: '', roaster: '', roast_level: '' });
      loadBeans();
    } catch (error) {
      console.error('Failed to create bean:', error);
      alert('Failed to create bean');
    }
  };

  const openLogFlow = () => {
    if (beans.length === 0) {
      setShowForm(true);
      return;
    }
    if (beans.length === 1) {
      navigate(`/beans/${beans[0].id}/add-record`);
      return;
    }
    setShowPicker(true);
  };

  const pickBean = (beanId: number) => {
    localStorage.setItem(LAST_BEAN_KEY, String(beanId));
    setShowPicker(false);
    navigate(`/beans/${beanId}/add-record`);
  };

  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }

  return (
    <div className="beans-page">
      <header className="hub-hero">
        <p className="hub-eyebrow">Espresso Tracker</p>
        <h1 className="hub-title">Ready to dial in?</h1>
        <p className="hub-subtitle">Log a shot in a few taps — numbers first, taste later.</p>
        <button type="button" className="btn btn-primary hub-log-cta" onClick={openLogFlow}>
          Log a shot
        </button>
      </header>

      <div className="hub-section-header">
        <h2 className="hub-section-title">Your beans</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn btn-secondary btn-compact"
        >
          {showForm ? (
            <>
              <IconClose size={16} /> Cancel
            </>
          ) : (
            <>
              <IconPlus size={16} /> Add bean
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card bean-form-panel">
          <h2 className="form-section-title">Add New Bean</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="bean-variety">Variety *</label>
              <input
                id="bean-variety"
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                required
                placeholder="e.g. Ethiopia Yirgacheffe"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="bean-seller">Seller</label>
              <input
                id="bean-seller"
                type="text"
                value={formData.seller}
                onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="bean-roaster">Roaster</label>
              <input
                id="bean-roaster"
                type="text"
                value={formData.roaster}
                onChange={(e) => setFormData({ ...formData, roaster: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="bean-roast">Roast Level</label>
              <select
                id="bean-roast"
                value={formData.roast_level}
                onChange={(e) => setFormData({ ...formData, roast_level: e.target.value })}
              >
                <option value="">Select roast level</option>
                <option value="Light">Light</option>
                <option value="Medium-Light">Medium-Light</option>
                <option value="Medium">Medium</option>
                <option value="Medium-Dark">Medium-Dark</option>
                <option value="Dark">Dark</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Create Bean
            </button>
          </form>
        </div>
      )}

      {beans.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconCup size={36} />
          </div>
          <h3>No beans yet</h3>
          <p>Add your first bean to start tracking shots.</p>
        </div>
      ) : (
        <>
          {beans.length > 4 && (
            <div className="bean-search">
              <label htmlFor="bean-search" className="sr-only">
                Search beans
              </label>
              <input
                id="bean-search"
                type="search"
                value={beanQuery}
                onChange={(e) => setBeanQuery(e.target.value)}
                placeholder="Search variety, roaster…"
                autoComplete="off"
              />
            </div>
          )}
          {filteredBeans.length === 0 ? (
            <div className="card empty-state compact">
              <h3>No matches</h3>
              <p>Try a different search.</p>
            </div>
          ) : (
            <ul className="beans-list">
              {filteredBeans.map((bean) => (
                <li key={bean.id}>
                  <Link to={`/beans/${bean.id}`} className="bean-row">
                    <div className="bean-row-body">
                      <h3>{bean.variety}</h3>
                      <div className="bean-row-meta">
                        {bean.roaster && <span>{bean.roaster}</span>}
                        {bean.roaster && bean.roast_level && <span className="meta-dot">·</span>}
                        {bean.roast_level && (
                          <span
                            className={`roast-badge ${bean.roast_level.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {bean.roast_level}
                          </span>
                        )}
                        {!bean.roaster && bean.seller && <span>{bean.seller}</span>}
                      </div>
                    </div>
                    <IconChevronRight size={20} className="bean-row-chevron" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showPicker && (
        <div className="sheet-overlay" role="presentation" onClick={() => setShowPicker(false)}>
          <div
            className="bean-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bean-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" aria-hidden />
            <div className="sheet-header">
              <h2 id="bean-picker-title">Which bean?</h2>
              <button
                type="button"
                className="btn-ghost sheet-close"
                aria-label="Close"
                onClick={() => setShowPicker(false)}
              >
                <IconClose size={20} />
              </button>
            </div>
            <div className="picker-search">
              <label htmlFor="picker-search" className="sr-only">
                Search beans
              </label>
              <input
                id="picker-search"
                type="search"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search beans…"
                autoComplete="off"
                enterKeyHint="search"
                autoFocus
              />
            </div>
            <ul className="picker-list">
              {sortedForPicker.length === 0 ? (
                <li className="picker-empty">No matching beans</li>
              ) : (
                sortedForPicker.map((bean) => (
                  <li key={bean.id}>
                    <button type="button" className="picker-row" onClick={() => pickBean(bean.id)}>
                      <div className="picker-row-body">
                        <span className="picker-row-title">{bean.variety}</span>
                        {bean.roaster && <span className="picker-row-meta">{bean.roaster}</span>}
                        {bean.id === lastBeanId && (
                          <span className="picker-continue">Continue with this</span>
                        )}
                      </div>
                      <IconChevronRight size={18} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeansList;
