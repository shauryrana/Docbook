const db = require('../db');

/**
 * Get all doctors with user info
 * GET /api/doctors
 */
const getAllDoctors = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        d.id,
        d.user_id,
        u.name,
        u.email,
        d.specialization,
        d.experience_years
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY u.name ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Get slots for a specific doctor
 * GET /api/doctors/:id/slots
 * Optional query param: ?only_available=true
 */
const getDoctorSlots = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { only_available } = req.query;

    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'Invalid doctor ID.' });
    }

    let query = `
      SELECT 
        id,
        doctor_id,
        TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date,
        TO_CHAR(start_time, 'HH24:MI') AS start_time,
        TO_CHAR(end_time, 'HH24:MI') AS end_time,
        is_booked
      FROM slots
      WHERE doctor_id = $1
    `;
    const params = [doctorId];

    if (only_available === 'true') {
      query += ` AND is_booked = false AND slot_date >= CURRENT_DATE`;
    }

    query += ` ORDER BY slot_date ASC, start_time ASC;`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllDoctors,
  getDoctorSlots,
};
