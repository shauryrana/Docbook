const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Patient books a slot
router.post('/', verifyToken, requireRole('patient'), appointmentController.bookAppointment);

// Patient cancels own appointment
router.patch('/:id/cancel', verifyToken, requireRole('patient'), appointmentController.cancelAppointment);

// Patient or Doctor fetches their appointments
router.get('/my', verifyToken, requireRole(['patient', 'doctor']), appointmentController.getMyAppointments);

// Doctor marks appointment as completed with notes/prescription
router.patch('/:id/complete', verifyToken, requireRole('doctor'), appointmentController.completeAppointment);

module.exports = router;
