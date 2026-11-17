const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MediSlot API is running smoothly.',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` MediSlot Server is listening on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

module.exports = app;
