// backend/src/utils/fileHelper.js
// Utility functions for handling uploaded files (Multer) and temporary file cleanup.

const fs = require('fs');
const path = require('path');

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
    return req.files.map((f) => ({ path: f.path, originalname: f.originalname }));
  }
  if (req.file) {
    return [{ path: req.file.path, originalname: req.file.originalname }];
  }
  return [];
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
};
