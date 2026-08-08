const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

// Ensure directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Retain original extension but make filename unique using UUID
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

// File Filtering (Images, PDFs, Audios, ZIPs)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.mp3', '.wav', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Supported types: PDF, JPG, PNG, WEBP, MP3, WAV, ZIP.`), false);
  }
};

// Multer limits configuration
const limits = {
  fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 // e.g. 50MB
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;
