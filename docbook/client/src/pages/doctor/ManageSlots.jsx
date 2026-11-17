import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { IconCalendar, IconUnlock, IconLock, IconClock, IconRefresh } from '../../components/Icons';

const ManageSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [filterSlotStatus, setFilterSlotStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');

  const fetchDoctorSlots = async () => {
    if (!user?.doctor_id) return;
    try {
      setLoading(true);
      const res = await api.get(`/doctors/${user.doctor_id}/slots`);
      setSlots(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch doctor availability slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorSlots();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSlotDate(tomorrow.toISOString().split('T')[0]);
  }, [user]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!slotDate || !startTime || !endTime) {
      setError('Please provide date, start time, and end time.');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be later than start time.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/slots', {
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
      });

      setSuccess('Availability slot created successfully!');
      fetchDoctorSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      setDeletingId(slotId);
      setError('');
      setSuccess('');
      await api.delete(`/slots/${slotId}`);
      setSuccess('Slot removed successfully.');
      fetchDoctorSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete slot.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => !s.is_booked).length;
  const bookedSlots = slots.filter((s) => s.is_booked).length;

  const filteredSlots = slots.filter((s) => {
    if (filterSlotStatus === 'available') return !s.is_booked;
    if (filterSlotStatus === 'booked') return s.is_booked;
    return true;
  });

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Doctor Schedule & Slots</h1>
          <p>Publish your consultation hours so patients can book available appointment windows</p>
        </div>
      </div>

      {/* Doctor Navigation Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <Link to="/doctor/appointments" className="tab-btn" style={{ textDecoration: 'none' }}>
          Patient Consultations
        </Link>
        <Link to="/doctor/slots" className="tab-btn active" style={{ textDecoration: 'none' }}>
          Manage Availability Slots
          <span className="tab-badge">{totalSlots}</span>
        </Link>
      </div>

      {/* Stats Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <IconCalendar size={24} />
          </div>
          <div>
            <div className="stat-val">{totalSlots}</div>
            <div className="stat-label">Total Published Slots</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <IconUnlock size={24} />
          </div>
          <div>
            <div className="stat-val">{availableSlots}</div>
            <div className="stat-label">Available for Booking</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <IconLock size={24} />
          </div>
          <div>
            <div className="stat-val">{bookedSlots}</div>
            <div className="stat-label">Reserved by Patients</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Slot Form */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Add New Availability Window</h2>
        <form onSubmit={handleAddSlot}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="slot-date">Date</label>
              <input
                id="slot-date"
                type="date"
                className="form-control"
                value={slotDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSlotDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="start-time">Start Time</label>
              <input
                id="start-time"
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="end-time">End Time</label>
              <input
                id="end-time"
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding Slot...' : '+ Publish Availability Slot'}
          </button>
        </form>
      </div>

      {/* Slots Filter Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${filterSlotStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterSlotStatus('all')}
        >
          All Slots
          <span className="tab-badge">{totalSlots}</span>
        </button>
        <button
          className={`tab-btn ${filterSlotStatus === 'available' ? 'active' : ''}`}
          onClick={() => setFilterSlotStatus('available')}
        >
          Open / Available
          <span className="tab-badge">{availableSlots}</span>
        </button>
        <button
          className={`tab-btn ${filterSlotStatus === 'booked' ? 'active' : ''}`}
          onClick={() => setFilterSlotStatus('booked')}
        >
          Reserved by Patients
          <span className="tab-badge">{bookedSlots}</span>
        </button>
      </div>

      {/* Slots List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <h2 className="card-title" style={{ fontSize: '1.15rem' }}>Schedule List</h2>
          <button className="btn btn-outline btn-sm" onClick={fetchDoctorSlots}>
            <IconRefresh size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading slots...</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconClock size={28} />
            </div>
            <h3>No Slots Found</h3>
            <p>No availability slots match the current filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Slot Date</th>
                  <th>Time Range</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.slot_date}</strong></td>
                    <td>{s.start_time} - {s.end_time}</td>
                    <td>
                      {s.is_booked ? (
                        <span className="badge badge-booked">Reserved by Patient</span>
                      ) : (
                        <span className="badge badge-completed">Available</span>
                      )}
                    </td>
                    <td>
                      {s.is_booked ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Locked (Reserved)</span>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deletingId === s.id}
                          onClick={() => handleDeleteSlot(s.id)}
                        >
                          {deletingId === s.id ? 'Deleting...' : 'Remove Slot'}
                        </button>
                      )}
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

export default ManageSlots;
