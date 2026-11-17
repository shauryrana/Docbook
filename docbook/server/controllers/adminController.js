const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * View all appointments across the system (Admin only)
 * GET /api/admin/appointments
 */
const getAllAppointments = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.status,
        a.created_at,
        TO_CHAR(s.slot_date, 'YYYY-MM-DD') AS slot_date,
        TO_CHAR(s.start_time, 'HH24:MI') AS start_time,
        TO_CHAR(s.end_time, 'HH24:MI') AS end_time,
        d.id AS doctor_id,
        doc_u.name AS doctor_name,
        doc_u.email AS doctor_email,
        d.specialization,
        pat_u.id AS patient_id,
        pat_u.name AS patient_name,
        pat_u.email AS patient_email,
        p.id AS prescription_id,
        p.notes AS prescription_notes,
        p.medicines AS prescription_medicines
      FROM appointments a
      JOIN slots s ON a.slot_id = s.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc_u ON d.user_id = doc_u.id
      JOIN users pat_u ON a.patient_id = pat_u.id
      LEFT JOIN prescriptions p ON p.appointment_id = a.id
      ORDER BY s.slot_date DESC, s.start_time DESC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Add a new doctor (Admin only)
 * Uses a SQL Transaction to insert user and doctor profile
 * POST /api/admin/doctors
 */
const addDoctor = async (req, res, next) => {
  const { name, email, password, specialization, experience_years } = req.body;

  if (!name || !email || !password || !specialization || experience_years === undefined) {
    return res.status(400).json({
      error: 'name, email, password, specialization, and experience_years are required.',
    });
  }

  const expYears = parseInt(experience_years, 10);
  if (isNaN(expYears) || expYears < 0) {
    return res.status(400).json({ error: 'experience_years must be a non-negative number.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check if email already exists
    const checkEmail = await client.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);
    if (checkEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Insert into users table
    const userInsert = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'doctor')
      RETURNING id, name, email, role, created_at;
    `;
    const userRes = await client.query(userInsert, [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
    ]);
    const newUser = userRes.rows[0];

    // 2. Insert into doctors table
    const docInsert = `
      INSERT INTO doctors (user_id, specialization, experience_years)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, specialization, experience_years;
    `;
    const docRes = await client.query(docInsert, [newUser.id, specialization.trim(), expYears]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Doctor added successfully.',
      doctor: {
        id: docRes.rows[0].id,
        user_id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        specialization: docRes.rows[0].specialization,
        experience_years: docRes.rows[0].experience_years,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Remove a doctor (Admin only)
 * DELETE /api/admin/doctors/:id
 */
const removeDoctor = async (req, res, next) => {
  const doctorId = parseInt(req.params.id, 10);

  if (isNaN(doctorId)) {
    return res.status(400).json({ error: 'Invalid doctor ID.' });
  }

  try {
    // Find doctor and associated user_id
    const docRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [doctorId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const userId = docRes.rows[0].user_id;

    // Deleting the user cascades to doctors, slots, and appointments due to ON DELETE CASCADE
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    return res.json({ message: 'Doctor and associated user profile removed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllAppointments,
  addDoctor,
  removeDoctor,
};
