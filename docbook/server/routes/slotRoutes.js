const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Doctor only slot management
router.post('/', verifyToken, requireRole('doctor'), slotController.createSlot);
router.delete('/:id', verifyToken, requireRole('doctor'), slotController.deleteSlot);

module.exports = router;
