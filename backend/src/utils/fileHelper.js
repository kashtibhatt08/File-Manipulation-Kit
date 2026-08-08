// backend/src/utils/fileHelper.js
// Utility functions for handling uploaded files (Multer) and temporary file cleanup.

const fs = require('fs');
const path = require('path');
const FileType = require('file-type');

const allowedFileTypes = {
  '.pdf': ['pdf'],
  '.jpg': ['jpg', 'jpeg'],
  '.jpeg': ['jpg', 'jpeg'],
  '.png': ['png'],
  '.webp': ['webp'],
  '.mp3': ['mp3'],
  '.wav': ['wav'],
  '.zip': ['zip']
};

/**
 * Retrieves the first uploaded file from req.files.
 * Returns undefined if no files were uploaded.
 */
function getFirstFile(req) {
  if (req.file) return req.file;
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  return undefined;
}

/**
 * Returns an array of all uploaded files (paths & original names).
 */
function getAllFiles(req) {
  if (Array.isArray(req.files) && req.files.length > 0) {
    return req.files.map((f) => ({ path: f.path, originalname: f.originalname, mimetype: f.mimetype }));
  }
  if (req.file) {
    return [{ path: req.file.path, originalname: req.file.originalname, mimetype: req.file.mimetype }];
  }
  return [];
}

/**
 * Validate the uploaded file content using real file signatures.
 */
async function validateUploadedFileType(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const expectedTypes = allowedFileTypes[ext];

  if (!expectedTypes) {
    throw new Error('Unsupported file type.');
  }

  const fromFileMethod = FileType.fromFile || FileType.fileTypeFromFile;
  if (!fromFileMethod) {
    throw new Error('Unsupported file-type version; cannot validate file signature.');
  }

  const type = await fromFileMethod(filePath);
  if (!type) {
    // Fallback: if file-type couldn't determine the file, accept known extensions.
    if (expectedTypes.length > 0) {
      return true;
    }
    throw new Error('Unable to verify uploaded file type.');
  }

  const detectedExt = type.ext.toLowerCase();
  const detectedMime = (type.mime || '').toLowerCase();

  if (expectedTypes.includes(detectedExt)) {
    return true;
  }

  // Allow commonly misnamed image uploads where the original file extension differs
  // from the actual image container format (e.g. JPG extension carrying WebP content).
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && detectedMime.startsWith('image/')) {
    return true;
  }

  if (expectedTypes.some((allowed) => detectedMime.includes(allowed))) {
    return true;
  }

  throw new Error(`File content does not match the expected type for ${originalName}. Detected type: ${detectedExt}/${detectedMime}`);
}

/**
 * Deletes an array of file paths asynchronously.
 */
function cleanupFiles(filePaths) {
  filePaths.forEach((p) => {
    fs.unlink(p, (err) => {
      if (err) console.error(`Failed to delete temporary file ${p}: ${err.message}`);
    });
  });
}

module.exports = {
  getFirstFile,
  getAllFiles,
  cleanupFiles,
  validateUploadedFileType
};
