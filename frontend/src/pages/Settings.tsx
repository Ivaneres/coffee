import React, { useState, useEffect } from 'react';
import { settingsApi, UserSettings } from '../api/settings';
import './Settings.css';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    default_machine: '',
    default_grinder: '',
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

    try {
      const updated = await settingsApi.update(formData);
      setSettings(updated);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>
      <div className="card">
        <h2>Default Equipment</h2>
        <p className="settings-description">
          Set your default espresso machine and grinder. These will be pre-filled when creating new records,
          but you can override them for each record.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Default Machine</label>
            <input
              type="text"
              value={formData.default_machine}
              onChange={(e) => setFormData({ ...formData, default_machine: e.target.value })}
              placeholder="e.g., La Marzocco Linea Mini"
            />
          </div>
          <div className="form-group">
            <label>Default Grinder</label>
            <input
              type="text"
              value={formData.default_grinder}
              onChange={(e) => setFormData({ ...formData, default_grinder: e.target.value })}
              placeholder="e.g., Eureka Mignon Specialità"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
