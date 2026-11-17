const db = require('../db');

/**
 * Book an appointment (Patient only)
 * Uses a strict SQL Transaction:
 * 1. Lock slot row with FOR UPDATE
 * 2. Verify slot is free and valid
 * 3. Mark slot as is_booked = true
 * 4. Insert appointment record
 * 5. Commit transaction (Rollback on any error)
 * POST /api/appointments
 */
const bookAppointment = async (req, res, next) => {
  const { slot_id } = req.body;
  const patientId = req.user.id;

  if (!slot_id) {
    return res.status(400).json({ error: 'slot_id is required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock slot row and check availability
    const slotQuery = 'SELECT id, doctor_id, is_booked FROM slots WHERE id = $1 FOR UPDATE';
    const slotRes = await client.query(slotQuery, [slot_id]);

    if (slotRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found.' });
    }

    const slot = slotRes.rows[0];
    if (slot.is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot has already been booked by another patient.' });
    }

    // 2. Mark slot as booked
    await client.query('UPDATE slots SET is_booked = true WHERE id = $1', [slot_id]);

    // 3. Create appointment
    const insertApptQuery = `
      INSERT INTO appointments (patient_id, doctor_id, slot_id, status)
      VALUES ($1, $2, $3, 'booked')
      RETURNING id, patient_id, doctor_id, slot_id, status, created_at;
    `;
    const apptRes = await client.query(insertApptQuery, [patientId, slot.doctor_id, slot_id]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment: apptRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Cancel an appointment (Patient only)
 * Uses a SQL Transaction:
 * 1. Lock appointment row
 * 2. Verify ownership and that status is 'booked'
 * 3. Update appointment status to 'cancelled'
 * 4. Free the slot (is_booked = false)
 * 5. Commit
 * PATCH /api/appointments/:id/cancel
 */
const cancelAppointment = async (req, res, next) => {
  const appointmentId = parseInt(req.params.id, 10);
  const patientId = req.user.id;

  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: 'Invalid appointment ID.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock appointment row
    const apptQuery = 'SELECT * FROM appointments WHERE id = $1 FOR UPDATE';
    const apptRes = await client.query(apptQuery, [appointmentId]);

    if (apptRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = apptRes.rows[0];

    // Ensure the patient owns this appointment
    if (appointment.patient_id !== patientId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: You can only cancel your own appointments.' });
    }

    if (appointment.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Appointment is already cancelled.' });
    }

    if (appointment.status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot cancel an appointment that is already completed.' });
    }

    // 2. Update appointment status
    await client.query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [appointmentId]);

    // 3. Free the slot so others can book it
    await client.query('UPDATE slots SET is_booked = false WHERE id = $1', [appointment.slot_id]);

    await client.query('COMMIT');

    return res.json({
      message: 'Appointment cancelled successfully and slot freed.',
      appointment_id: appointmentId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Get appointments for logged in user (patient or doctor)
 * GET /api/appointments/my
 */
const getMyAppointments = async (req, res, next) => {
  try {
    const user = req.user;
    let query = `
      SELECT 
        a.id,
        a.status,
        a.created_at,
        TO_CHAR(s.slot_date, 'YYYY-MM-DD') AS slot_date,
        TO_CHAR(s.start_time, 'HH24:MI') AS start_time,
        TO_CHAR(s.end_time, 'HH24:MI') AS end_time,
        a.slot_id,
        d.id AS doctor_id,
        doc_u.name AS doctor_name,
        doc_u.email AS doctor_email,
        d.specialization,
        pat_u.id AS patient_id,
        pat_u.name AS patient_name,
        pat_u.email AS patient_email,
        p.id AS prescription_id,
        p.notes AS prescription_notes,
        p.medicines AS prescription_medicines,
        p.created_at AS prescription_created_at
      FROM appointments a
      JOIN slots s ON a.slot_id = s.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc_u ON d.user_id = doc_u.id
      JOIN users pat_u ON a.patient_id = pat_u.id
      LEFT JOIN prescriptions p ON p.appointment_id = a.id
    `;

    const params = [];

    if (user.role === 'patient') {
      query += ' WHERE a.patient_id = $1';
      params.push(user.id);
    } else if (user.role === 'doctor') {
      // Find doctor_id if not present
      let doctorId = user.doctor_id;
      if (!doctorId) {
        const docRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
        if (docRes.rows.length === 0) {
          return res.status(404).json({ error: 'Doctor profile not found.' });
        }
        doctorId = docRes.rows[0].id;
      }
      query += ' WHERE a.doctor_id = $1';
      params.push(doctorId);
    } else {
      return res.status(403).json({ error: 'Access restricted to patients and doctors.' });
    }

    query += ' ORDER BY s.slot_date DESC, s.start_time DESC;';

    const result = await db.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Mark appointment as completed & issue prescription/notes (Doctor only)
 * PATCH /api/appointments/:id/complete
 */
const completeAppointment = async (req, res, next) => {
  const appointmentId = parseInt(req.params.id, 10);
  const { notes, medicines } = req.body;

  if (isNaN(appointmentId)) {
    return res.status(400).json({ error: 'Invalid appointment ID.' });
  }

  if (!notes || !medicines) {
    return res.status(400).json({ error: 'Prescription notes and medicines are required.' });
  }

  let doctorId = req.user.doctor_id;
  if (!doctorId) {
    const docRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }
    doctorId = docRes.rows[0].id;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify appointment exists and belongs to this doctor
    const apptCheck = await client.query(
      'SELECT * FROM appointments WHERE id = $1 FOR UPDATE',
      [appointmentId]
    );

    if (apptCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = apptCheck.rows[0];

    if (appointment.doctor_id !== doctorId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: You can only complete your own appointments.' });
    }

    if (appointment.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot complete a cancelled appointment.' });
    }

    if (appointment.status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Appointment is already marked as completed.' });
    }

    // 2. Mark appointment as completed
    await client.query("UPDATE appointments SET status = 'completed' WHERE id = $1", [appointmentId]);

    // 3. Insert prescription
    const presQuery = `
      INSERT INTO prescriptions (appointment_id, notes, medicines)
      VALUES ($1, $2, $3)
      RETURNING id, appointment_id, notes, medicines, created_at;
    `;
    const presRes = await client.query(presQuery, [appointmentId, notes.trim(), medicines.trim()]);

    await client.query('COMMIT');

    return res.json({
      message: 'Appointment marked as completed and prescription issued.',
      appointment_id: appointmentId,
      prescription: presRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  completeAppointment,
};
