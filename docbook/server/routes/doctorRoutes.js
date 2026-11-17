const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Public endpoints to browse doctors and their slots
router.get('/', doctorController.getAllDoctors);
router.get('/:id/slots', doctorController.getDoctorSlots);

module.exports = router;
