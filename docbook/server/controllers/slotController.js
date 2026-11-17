const db = require('../db');

/**
 * Add a new availability slot for the logged-in doctor
 * POST /api/slots
 */
const createSlot = async (req, res, next) => {
  try {
    const { slot_date, start_time, end_time } = req.body;

    if (!slot_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'slot_date, start_time, and end_time are required.' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: 'end_time must be strictly after start_time.' });
    }

    // Determine doctor_id
    let doctorId = req.user.doctor_id;
    if (!doctorId) {
      const docRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor profile not found for this user.' });
      }
      doctorId = docRes.rows[0].id;
    }

    // Check for overlapping slots for the same doctor on the same date
    const overlapCheck = `
      SELECT id FROM slots
      WHERE doctor_id = $1
        AND slot_date = $2
        AND NOT (end_time <= $3 OR start_time >= $4);
    `;
    const overlapRes = await db.query(overlapCheck, [doctorId, slot_date, start_time, end_time]);
    if (overlapRes.rows.length > 0) {
      return res.status(409).json({ error: 'This slot overlaps with an existing slot for this doctor.' });
    }

    const insertQuery = `
      INSERT INTO slots (doctor_id, slot_date, start_time, end_time, is_booked)
      VALUES ($1, $2, $3, $4, false)
      RETURNING 
        id, 
        doctor_id, 
        TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, 
        TO_CHAR(start_time, 'HH24:MI') AS start_time, 
        TO_CHAR(end_time, 'HH24:MI') AS end_time, 
        is_booked;
    `;
    const result = await db.query(insertQuery, [doctorId, slot_date, start_time, end_time]);

    res.status(201).json({
      message: 'Slot created successfully.',
      slot: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove an availability slot (Doctor only)
 * DELETE /api/slots/:id
 */
const deleteSlot = async (req, res, next) => {
  try {
    const slotId = parseInt(req.params.id, 10);
    if (isNaN(slotId)) {
      return res.status(400).json({ error: 'Invalid slot ID.' });
    }

    // Determine doctor_id
    let doctorId = req.user.doctor_id;
    if (!doctorId) {
      const docRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor profile not found.' });
      }
      doctorId = docRes.rows[0].id;
    }

    // Verify slot belongs to doctor
    const slotCheck = await db.query('SELECT * FROM slots WHERE id = $1', [slotId]);
    if (slotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    const slot = slotCheck.rows[0];
    if (slot.doctor_id !== doctorId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this slot.' });
    }

    if (slot.is_booked) {
      return res.status(400).json({
        error: 'Cannot delete a slot that is currently booked by a patient.',
      });
    }

    await db.query('DELETE FROM slots WHERE id = $1', [slotId]);

    res.json({ message: 'Slot deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSlot,
  deleteSlot,
};
