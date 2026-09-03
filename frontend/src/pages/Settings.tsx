import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi, UserSettings } from '../api/settings';
import { useAuth } from '../contexts/AuthContext';
import { IconUser } from '../components/Icons';
import './Settings.css';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    default_machine: '',
    default_grinder: '',
    default_dose: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setFormData({
        default_machine: data.default_machine || '',
        default_grinder: data.default_grinder || '',
        default_dose: data.default_dose != null ? String(data.default_dose) : '',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await settingsApi.update({
        default_machine: formData.default_machine,
        default_grinder: formData.default_grinder,
        default_dose: formData.default_dose === '' ? null : parseFloat(formData.default_dose),
      });
      setSettings(updated);
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and shot defaults</p>
        </div>
      </div>

      <div className="card account-card">
        <div className="account-row">
          <div className="account-avatar" aria-hidden="true">
            <IconUser size={24} />
          </div>
          <div className="account-info">
            <span className="account-label">Signed in as</span>
            <span className="account-name">{user?.username}</span>
            {user?.email && <span className="account-email">{user.email}</span>}
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-secondary btn-block">
          Logout
        </button>
      </div>

      <div className="card">
        <h2 className="form-section-title">Shot defaults</h2>
        <p className="settings-description">
          Pre-filled when you log a new shot. Last shot for that bean wins when available.
        </p>
        {message && (
          <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="default-machine">Default Machine</label>
            <input
              id="default-machine"
              type="text"
              value={formData.default_machine}
              onChange={(e) => setFormData({ ...formData, default_machine: e.target.value })}
              placeholder="e.g., La Marzocco Linea Mini"
            />
          </div>
          <div className="form-group">
            <label htmlFor="default-grinder">Default Grinder</label>
            <input
              id="default-grinder"
              type="text"
              value={formData.default_grinder}
              onChange={(e) => setFormData({ ...formData, default_grinder: e.target.value })}
              placeholder="e.g., Eureka Mignon Specialità"
            />
          </div>
          <div className="form-group">
            <label htmlFor="default-dose">Default Dose (g)</label>
            <input
              id="default-dose"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={formData.default_dose}
              onChange={(e) => setFormData({ ...formData, default_dose: e.target.value })}
              placeholder="e.g., 18"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
