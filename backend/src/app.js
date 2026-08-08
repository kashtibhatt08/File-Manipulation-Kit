const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startCleanupCron, initializeTempDir } = require('./utils/cleanup');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB database
connectDB();

// Initialize temp directory structure
initializeTempDir();

// Start the 15-minute file cleanup cron scheduler
startCleanupCron();

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Express Middlewares
app.use(cors({
  origin: '*', // Customize to restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Server API health/status check route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Universal File Toolkit API is online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Central Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
