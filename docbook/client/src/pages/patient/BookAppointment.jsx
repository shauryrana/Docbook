import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { IconCalendar, IconClock, IconDoctor } from '../../components/Icons';

const BookAppointment = () => {
  const { doctorId: paramDoctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(paramDoctorId || '');
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch all doctors for selection
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await api.get('/doctors');
        setDoctors(res.data);
        if (!selectedDoctorId && res.data.length > 0) {
          setSelectedDoctorId(String(res.data[0].id));
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch doctors list.');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Update selectedDoctorId if URL parameter changes
  useEffect(() => {
    if (paramDoctorId) {
      setSelectedDoctorId(paramDoctorId);
    }
  }, [paramDoctorId]);

  // 2. Fetch available slots when a doctor is selected
  useEffect(() => {
    if (!selectedDoctorId) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlotId(null);
        setError('');
        const res = await api.get(`/doctors/${selectedDoctorId}/slots?only_available=true`);
        setSlots(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch doctor slots.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId]);

  const handleBooking = async () => {
    if (!selectedSlotId) {
      setError('Please select an available appointment slot.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/appointments', { slot_id: selectedSlotId });
      setSuccess('Appointment successfully booked! Redirecting to your appointments...');
      setTimeout(() => {
        navigate('/my-appointments');
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Booking failed. The slot may have just been taken by another patient.'
      );
      // Refresh slots in case slot was taken
      const res = await api.get(`/doctors/${selectedDoctorId}/slots?only_available=true`);
      setSlots(res.data);
      setSelectedSlotId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    acc[slot.slot_date] = acc[slot.slot_date] || [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  const currentDoctor = doctors.find((d) => String(d.id) === String(selectedDoctorId));

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Book an Appointment</h1>
        <p style={{ color: 'var(--text-muted)' }}>Choose your doctor, pick a convenient time slot, and confirm</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>1. Select Doctor</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="doctor-select">Choose Doctor</label>
          <select
            id="doctor-select"
            className="form-control"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            disabled={loadingDoctors}
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — {doc.specialization} ({doc.experience_years} yrs exp)
              </option>
            ))}
          </select>
        </div>

        {currentDoctor && (
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <strong>Selected:</strong> {currentDoctor.name} ({currentDoctor.specialization}) — Email: {currentDoctor.email}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>2. Available Time Slots</h2>

        {loadingSlots ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading available slots...</p>
          </div>
        ) : Object.keys(groupedSlots).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconCalendar size={28} />
            </div>
            <h3>No Available Slots</h3>
            <p>This doctor does not have any open slots at the moment. Please select another doctor or check back later.</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                  Date: {date}
                </h3>
                <div className="slots-grid">
                  {dateSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        type="button"
                        key={slot.id}
                        className={`slot-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedSlotId(slot.id)}
                      >
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'inherit' }}>
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {isSelected ? 'Selected' : 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Ready to finalize?</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {selectedSlotId ? 'Slot selected. Click confirm to reserve.' : 'Please select a time slot above.'}
          </div>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedSlotId || submitting}
          onClick={handleBooking}
        >
          {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
};

export default BookAppointment;
