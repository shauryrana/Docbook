import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { IconUsers, IconPending, IconCheck, IconDoctor } from '../../components/Icons';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Complete Appointment Modal state
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View prescription modal state
  const [viewPrescription, setViewPrescription] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch doctor appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const openCompleteModal = (appt) => {
    setActiveAppointment(appt);
    setNotes('');
    setMedicines('');
    setError('');
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim() || !medicines.trim()) {
      setError('Please provide both consultation notes and medicines.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.patch(`/appointments/${activeAppointment.id}/complete`, {
        notes,
        medicines,
      });

      setSuccess(`Appointment #${activeAppointment.id} marked as completed and prescription recorded.`);
      setActiveAppointment(null);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = appointments.length;
  const bookedCount = appointments.filter((a) => a.status === 'booked').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter((appt) => {
    if (filterStatus === 'all') return true;
    return appt.status === filterStatus;
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
          <h1>Doctor Clinical Portal</h1>
          <p>Review booked patients, record clinical consultation notes, and issue digital prescriptions</p>
        </div>
        <Link to="/doctor/slots" className="btn btn-primary">
          + Add New Time Slot
        </Link>
      </div>

      {/* Doctor Navigation Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <Link to="/doctor/appointments" className="tab-btn active" style={{ textDecoration: 'none' }}>
          Patient Consultations
          <span className="tab-badge">{totalCount}</span>
        </Link>
        <Link to="/doctor/slots" className="tab-btn" style={{ textDecoration: 'none' }}>
          Manage Availability Slots
        </Link>
      </div>

      {/* Stats Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <IconUsers size={24} />
          </div>
          <div>
            <div className="stat-val">{totalCount}</div>
            <div className="stat-label">Total Assigned Patients</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconPending size={24} />
          </div>
          <div>
            <div className="stat-val">{bookedCount}</div>
            <div className="stat-label">Pending Consultations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <IconCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{completedCount}</div>
            <div className="stat-label">Completed & Prescribed</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Appointment Filter Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({totalCount})
        </button>
        <button
          className={`tab-btn ${filterStatus === 'booked' ? 'active' : ''}`}
          onClick={() => setFilterStatus('booked')}
        >
          Booked / Upcoming ({bookedCount})
        </button>
        <button
          className={`tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          Completed ({completedCount})
        </button>
        <button
          className={`tab-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading patient appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconDoctor size={28} />
          </div>
          <h3>No Appointments Found</h3>
          <p>No appointments match the "{filterStatus}" filter criteria.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Patient Email</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td><strong>{appt.patient_name}</strong></td>
                    <td>{appt.patient_email}</td>
                    <td>{appt.slot_date}</td>
                    <td>{appt.start_time} - {appt.end_time}</td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {appt.status === 'booked' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openCompleteModal(appt)}
                          >
                            Complete & Prescribe
                          </button>
                        )}

                        {appt.status === 'completed' && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setViewPrescription(appt)}
                          >
                            View Prescription
                          </button>
                        )}

                        {appt.status === 'cancelled' && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cancelled</span>
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

      {/* Complete Appointment Modal */}
      {activeAppointment && (
        <div className="modal-overlay" onClick={() => setActiveAppointment(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Complete Appointment</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setActiveAppointment(null)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p><strong>Patient:</strong> {activeAppointment.patient_name} ({activeAppointment.patient_email})</p>
              <p><strong>Session:</strong> {activeAppointment.slot_date} ({activeAppointment.start_time} - {activeAppointment.end_time})</p>
            </div>

            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="clinical-notes">Clinical Notes / Diagnosis</label>
                <textarea
                  id="clinical-notes"
                  className="form-control"
                  placeholder="e.g. Patient presents with seasonal allergies. Normal vitals. Advised rest and hydration."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prescribed-medicines">Prescribed Medicines & Dosage</label>
                <textarea
                  id="prescribed-medicines"
                  className="form-control"
                  placeholder="e.g. 1. Cetirizine 10mg - 1 tablet daily at bedtime for 5 days.&#10;2. Paracetamol 500mg - as needed."
                  value={medicines}
                  onChange={(e) => setMedicines(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setActiveAppointment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Save & Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {viewPrescription && (
        <div className="modal-overlay" onClick={() => setViewPrescription(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Prescription Record</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setViewPrescription(null)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p><strong>Patient:</strong> {viewPrescription.patient_name}</p>
              <p><strong>Date:</strong> {viewPrescription.slot_date}</p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Diagnosis & Clinical Notes:
              </h4>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {viewPrescription.prescription_notes || 'No notes available.'}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Medicines:
              </h4>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {viewPrescription.prescription_medicines || 'No medicines recorded.'}
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setViewPrescription(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
