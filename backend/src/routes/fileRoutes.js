const express = require('express');
const {
  handlePDF,
  handleImage,
  handleAudio,
  handleZip,
  downloadFile,
  getHistory
} = require('../controllers/toolController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// File Tool Processing Endpoints
router.post('/pdf', optionalAuth, upload.any(), handlePDF);
router.post('/image', optionalAuth, upload.any(), handleImage);
router.post('/audio', optionalAuth, upload.any(), handleAudio);
router.post('/zip', optionalAuth, upload.any(), handleZip);

// File Download & User History Endpoints
router.get('/download/:token', optionalAuth, downloadFile);
router.get('/history', protect, getHistory);

module.exports = router;
