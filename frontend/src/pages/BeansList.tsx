import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { beansApi, Bean } from '../api/beans';
import './BeansList.css';

const BeansList: React.FC = () => {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    variety: '',
    seller: '',
    roaster: '',
    roast_level: '',
  });

  useEffect(() => {
    loadBeans();
  }, []);

  const loadBeans = async () => {
    try {
      const data = await beansApi.getAll();
      setBeans(data);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Beans</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Bean'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Add New Bean</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Variety *</label>
              <input
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Seller</label>
              <input
                type="text"
                value={formData.seller}
                onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Roaster</label>
              <input
                type="text"
                value={formData.roaster}
                onChange={(e) => setFormData({ ...formData, roaster: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Roast Level</label>
              <select
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
            <button type="submit" className="btn btn-primary">
              Create Bean
            </button>
          </form>
        </div>
      )}

      {beans.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">☕</div>
          <h3>No beans yet</h3>
          <p>Add your first bean to start tracking your espresso journey!</p>
        </div>
      ) : (
        <div className="beans-grid">
          {beans.map((bean) => (
            <Link key={bean.id} to={`/beans/${bean.id}`} className="bean-card">
              <div className="bean-card-header">
                <h3>{bean.variety}</h3>
              </div>
              <div className="bean-info-list">
                {bean.roaster && (
                  <div className="bean-info">
                    <span className="bean-info-label">Roaster:</span>
                    <span className="bean-info-value">{bean.roaster}</span>
                  </div>
                )}
                {bean.seller && (
                  <div className="bean-info">
                    <span className="bean-info-label">Seller:</span>
                    <span className="bean-info-value">{bean.seller}</span>
                  </div>
                )}
                {bean.roast_level && (
                  <div className="bean-info">
                    <span className="bean-info-label">Roast:</span>
                    <span className={`roast-badge ${bean.roast_level.toLowerCase().replace(/\s+/g, '-')}`}>
                      {bean.roast_level}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BeansList;
