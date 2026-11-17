import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { IconHospital, IconPending, IconCheck, IconClipboard, IconRefresh } from '../../components/Icons';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/appointments');
      setAppointments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const totalAppts = appointments.length;
  const bookedAppts = appointments.filter((a) => a.status === 'booked').length;
  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter((appt) => {
    const matchesStatus = filterStatus === 'all' || appt.status === filterStatus;
    const matchesSearch =
      appt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'booked':
        return <span className="badge badge-booked">Booked</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Clinic Administrative Console</h1>
          <p>System-wide monitoring of all doctor bookings, patient records, and clinical prescriptions</p>
        </div>
        <Link to="/admin/doctors" className="btn btn-primary">
          + Add New Doctor
        </Link>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/appointments" className="tab-btn active" style={{ textDecoration: 'none' }}>
          All Clinic Appointments
          <span className="tab-badge">{totalAppts}</span>
        </Link>
        <Link to="/admin/doctors" className="tab-btn" style={{ textDecoration: 'none' }}>
          Manage Doctors
        </Link>
      </div>

      {/* Stats Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <IconHospital size={24} />
          </div>
          <div>
            <div className="stat-val">{totalAppts}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconPending size={24} />
          </div>
          <div>
            <div className="stat-val">{bookedAppts}</div>
            <div className="stat-label">Active / Booked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <IconCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{completedAppts}</div>
            <div className="stat-label">Completed Consultations</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Tabs */}
          <div className="tabs-nav" style={{ marginBottom: 0 }}>
            <button
              className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({totalAppts})
            </button>
            <button
              className={`tab-btn ${filterStatus === 'booked' ? 'active' : ''}`}
              onClick={() => setFilterStatus('booked')}
            >
              Booked ({bookedAppts})
            </button>
            <button
              className={`tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed ({completedAppts})
            </button>
            <button
              className={`tab-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
              onClick={() => setFilterStatus('cancelled')}
            >
              Cancelled ({cancelledAppts})
            </button>
          </div>

          <div style={{ minWidth: '260px', flex: 1, maxWidth: '360px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search doctor, patient, specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading clinic appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconClipboard size={28} />
          </div>
          <h3>No Appointments Found</h3>
          <p>No appointments match the selected filter and search criteria.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Prescription</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td><strong>#{appt.id}</strong></td>
                    <td>
                      <strong>{appt.patient_name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.patient_email}</div>
                    </td>
                    <td>
                      <strong>{appt.doctor_name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.doctor_email}</div>
                    </td>
                    <td>{appt.specialization}</td>
                    <td>
                      <div>{appt.slot_date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.start_time} - {appt.end_time}</div>
                    </td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td>
                      {appt.prescription_id ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedPrescription(appt)}
                        >
                          View
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {selectedPrescription && (
        <div className="modal-overlay" onClick={() => setSelectedPrescription(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Prescription Details</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedPrescription(null)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p><strong>Appointment ID:</strong> #{selectedPrescription.id}</p>
              <p><strong>Patient:</strong> {selectedPrescription.patient_name} ({selectedPrescription.patient_email})</p>
              <p><strong>Doctor:</strong> {selectedPrescription.doctor_name} ({selectedPrescription.specialization})</p>
              <p><strong>Date:</strong> {selectedPrescription.slot_date}</p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Clinical Notes:
              </h4>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {selectedPrescription.prescription_notes}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Prescribed Medicines:
              </h4>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {selectedPrescription.prescription_medicines}
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setSelectedPrescription(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
