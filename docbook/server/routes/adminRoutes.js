const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(verifyToken, requireRole('admin'));

router.get('/appointments', adminController.getAllAppointments);
router.post('/doctors', adminController.addDoctor);
router.delete('/doctors/:id', adminController.removeDoctor);

module.exports = router;
