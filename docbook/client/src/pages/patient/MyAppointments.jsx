import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { IconClipboard, IconPending, IconCheck, IconDocument } from '../../components/Icons';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This will free the slot.')) {
      return;
    }

    try {
      setActionLoadingId(appointmentId);
      setError('');
      setSuccess('');
      const res = await api.patch(`/appointments/${appointmentId}/cancel`);
      setSuccess(res.data.message || 'Appointment cancelled successfully.');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

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

  const totalCount = appointments.length;
  const bookedCount = appointments.filter((a) => a.status === 'booked').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div>
      {/* Hero Header */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>My Appointments</h1>
          <p>Review your consultation history, manage upcoming visits, and view doctor prescriptions</p>
        </div>
        <Link to="/book" className="btn btn-primary">
          + Book New Slot
        </Link>
      </div>

      {/* Stats Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <IconClipboard size={24} />
          </div>
          <div>
            <div className="stat-val">{totalCount}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconPending size={24} />
          </div>
          <div>
            <div className="stat-val">{bookedCount}</div>
            <div className="stat-label">Upcoming / Booked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <IconCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{completedCount}</div>
            <div className="stat-label">Completed Consultations</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Status Filter Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Appointments
          <span className="tab-badge">{totalCount}</span>
        </button>
        <button
          className={`tab-btn ${filterStatus === 'booked' ? 'active' : ''}`}
          onClick={() => setFilterStatus('booked')}
        >
          Upcoming / Booked
          <span className="tab-badge">{bookedCount}</span>
        </button>
        <button
          className={`tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          Completed
          <span className="tab-badge">{completedCount}</span>
        </button>
        <button
          className={`tab-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          Cancelled
          <span className="tab-badge">{cancelledCount}</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconClipboard size={28} />
          </div>
          <h3>No Appointments Found</h3>
          <p>No appointments match the "{filterStatus}" filter.</p>
          {filterStatus === 'all' && (
            <div style={{ marginTop: '1rem' }}>
              <Link to="/book" className="btn btn-primary">Book Your First Slot</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <strong>{appt.doctor_name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.doctor_email}</div>
                    </td>
                    <td>{appt.specialization}</td>
                    <td>{appt.slot_date}</td>
                    <td>{appt.start_time} - {appt.end_time}</td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {appt.status === 'booked' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoadingId === appt.id}
                            onClick={() => handleCancel(appt.id)}
                          >
                            {actionLoadingId === appt.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}

                        {appt.status === 'completed' && appt.prescription_id && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setSelectedPrescription(appt)}
                          >
                            View Prescription
                          </button>
                        )}

                        {appt.status === 'completed' && !appt.prescription_id && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No prescription</span>
                        )}

                        {appt.status === 'cancelled' && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Slot released</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescription View Modal */}
      {selectedPrescription && (
        <div className="modal-overlay" onClick={() => setSelectedPrescription(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Doctor Prescription</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedPrescription(null)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p><strong>Doctor:</strong> {selectedPrescription.doctor_name} ({selectedPrescription.specialization})</p>
              <p><strong>Date:</strong> {selectedPrescription.slot_date} at {selectedPrescription.start_time}</p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Doctor's Clinical Notes
              </h4>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {selectedPrescription.prescription_notes || 'No notes provided.'}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Prescribed Medicines & Dosage
              </h4>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {selectedPrescription.prescription_medicines || 'No medicines prescribed.'}
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setSelectedPrescription(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
