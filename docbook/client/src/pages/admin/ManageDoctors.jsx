import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { IconDoctor, IconSpecialty, IconShield, IconRefresh } from '../../components/Icons';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load doctors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password || !specialization.trim()) {
      setError('All fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/admin/doctors', {
        name: name.trim(),
        email: email.trim(),
        password,
        specialization: specialization.trim(),
        experience_years: parseInt(experienceYears, 10),
      });

      setSuccess(`Doctor "${name}" added successfully.`);
      setName('');
      setEmail('');
      setPassword('');
      setSpecialization('');
      setExperienceYears('5');
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${doctorName}? This will also delete their slots and associated user account.`)) {
      return;
    }

    try {
      setDeletingId(doctorId);
      setError('');
      setSuccess('');
      await api.delete(`/admin/doctors/${doctorId}`);
      setSuccess(`Doctor removed successfully.`);
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove doctor.');
    } finally {
      setDeletingId(null);
    }
  };

  const specialtiesCount = new Set(doctors.map((d) => d.specialization)).size;

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Manage Medical Personnel</h1>
          <p>Register certified clinic specialists, configure initial credentials, and manage medical staff</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/appointments" className="tab-btn" style={{ textDecoration: 'none' }}>
          All Clinic Appointments
        </Link>
        <Link to="/admin/doctors" className="tab-btn active" style={{ textDecoration: 'none' }}>
          Manage Doctors
          <span className="tab-badge">{doctors.length}</span>
        </Link>
      </div>

      {/* Stats Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <IconDoctor size={24} />
          </div>
          <div>
            <div className="stat-val">{doctors.length}</div>
            <div className="stat-label">Active Doctors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <IconSpecialty size={24} />
          </div>
          <div>
            <div className="stat-val">{specialtiesCount}</div>
            <div className="stat-label">Medical Specialties</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconShield size={24} />
          </div>
          <div>
            <div className="stat-val">Admin</div>
            <div className="stat-label">Access Level</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Doctor Form */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Add New Doctor</h2>
        <form onSubmit={handleAddDoctor}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="doc-name">Full Name</label>
              <input
                id="doc-name"
                type="text"
                className="form-control"
                placeholder="e.g. Dr. Rajesh Gupta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-email">Email Address</label>
              <input
                id="doc-email"
                type="email"
                className="form-control"
                placeholder="e.g. dr.rajesh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-password">Temporary Password</label>
              <input
                id="doc-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="doc-spec">Specialization</label>
              <input
                id="doc-spec"
                type="text"
                className="form-control"
                placeholder="e.g. Neurology, Pediatrics, Orthopedics"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-exp">Years of Experience</label>
              <input
                id="doc-exp"
                type="number"
                min="0"
                className="form-control"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding Doctor...' : '+ Register Doctor'}
          </button>
        </form>
      </div>

      {/* Doctors List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <h2 className="card-title" style={{ fontSize: '1.15rem' }}>Current Doctors List</h2>
          <button className="btn btn-outline btn-sm" onClick={fetchDoctors}>
            <IconRefresh size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconDoctor size={28} />
            </div>
            <h3>No Doctors Registered</h3>
            <p>Use the form above to add your first doctor.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td><strong>{doc.name}</strong></td>
                    <td>{doc.email}</td>
                    <td>
                      <span className="badge badge-patient">{doc.specialization}</span>
                    </td>
                    <td>{doc.experience_years} years</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === doc.id}
                        onClick={() => handleRemoveDoctor(doc.id, doc.name)}
                      >
                        {deletingId === doc.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDoctors;
