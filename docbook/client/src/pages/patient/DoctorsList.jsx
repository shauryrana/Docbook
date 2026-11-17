import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { IconDoctor, IconSpecialty, IconCalendar, IconSearch } from '../../components/Icons';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchDoctors();
  }, []);

  const specialties = ['all', ...Array.from(new Set(doctors.map((d) => d.specialization)))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      doc.specialization.toLowerCase() === selectedSpecialty.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Welcome to Docbook</h1>
          <p>Book certified medical specialists with real-time slot reservations</p>
        </div>
        <Link to="/book" className="btn btn-primary">
          + Book an Appointment
        </Link>
      </div>

      {/* Quick Stats Grid */}
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
            <div className="stat-val">{specialties.length - 1 || 2}</div>
            <div className="stat-label">Specialties Available</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconCalendar size={24} />
          </div>
          <div>
            <div className="stat-val">Realtime</div>
            <div className="stat-label">Slot Booking</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Specialty Tabs */}
          <div className="tabs-nav" style={{ marginBottom: 0 }}>
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                className={`tab-btn ${selectedSpecialty === spec ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(spec)}
              >
                {spec === 'all' ? 'All Specialties' : spec}
                <span className="tab-badge">
                  {spec === 'all'
                    ? doctors.length
                    : doctors.filter((d) => d.specialization.toLowerCase() === spec.toLowerCase()).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ minWidth: '260px', flex: '1', maxWidth: '360px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search doctor or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading available doctors...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconDoctor size={28} />
          </div>
          <h3>No doctors found</h3>
          <p>No doctors match the selected filter or search term.</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="doctor-card">
              <div>
                <div className="doctor-avatar">
                  {doc.name.replace('Dr. ', '').charAt(0)}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{doc.name}</h3>
                <span className="badge badge-patient" style={{ marginBottom: '0.75rem' }}>
                  {doc.specialization}
                </span>

                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <p><strong>Experience:</strong> {doc.experience_years} years in practice</p>
                  <p><strong>Email:</strong> {doc.email}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <Link to={`/book/${doc.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  View Slots & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
