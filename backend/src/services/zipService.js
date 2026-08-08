const archiver = require('archiver');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

/**
 * Sanitizes zip entry names to prevent traversal/absolute path traversal vulnerabilities
 */
const sanitizeZipEntryName = (name) => {
  if (!name) return 'file';
  
  // Replace backslashes with forward slashes
  let sanitized = name.replace(/\\/g, '/');
  
  // Remove drive letters (e.g., C:/path -> /path)
  sanitized = sanitized.replace(/^[a-zA-Z]:/g, '');
  
  // Split path into segments
  const segments = sanitized.split('/');
  
  // Filter out empty segments and traversal segments ('..', '.')
  const safeSegments = segments.filter(seg => {
    const s = seg.trim();
    return s !== '' && s !== '..' && s !== '.';
  });
  
  // Reconstruct path
  let safeName = safeSegments.join('/');
  
  // Fallback if everything was stripped
  if (!safeName) {
    safeName = `file_${uuidv4().substring(0, 8)}`;
  }
  
  return safeName;
};

/**
 * Zip an array of files
 * @param {Array<Object>} files - Array of files with path and originalName
 * @returns {Promise<string>} - Path to the created zip file
 */
exports.zipFiles = (files) => {
  return new Promise((resolve, reject) => {
    const outputFilename = `${uuidv4()}_archive.zip`;
    const outputPath = path.join(TEMP_DIR, outputFilename);
    const outputStream = fs.createWriteStream(outputPath);
    
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression level
    });

    outputStream.on('close', () => {
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(outputStream);

    // Add each file to the zip archive with sanitized entry name
    files.forEach(file => {
      archive.file(file.path, { name: sanitizeZipEntryName(file.originalname) });
    });

    archive.finalize();
  });
};

/**
 * Unzip a single zip file and return paths to extracted contents
 * @param {string} filePath - Absolute path to zip file
 * @returns {Promise<Object>} - Extracted files list and the extraction path
 */
exports.unzipFile = async (filePath) => {
  const extractedFiles = [];
  const extractionDirName = `unzipped_${uuidv4()}`;
  const extractionPath = path.join(TEMP_DIR, extractionDirName);

  // Ensure unique subfolder exists for extracted contents to prevent collision
  fs.mkdirSync(extractionPath, { recursive: true });

  let directory;
  try {
    directory = await unzipper.Open.file(filePath);
  } catch (err) {
    fs.rmSync(extractionPath, { recursive: true, force: true });
    throw new Error('Invalid or corrupted ZIP file.');
  }

  if (!directory || !directory.files || directory.files.length === 0) {
    fs.rmSync(extractionPath, { recursive: true, force: true });
    throw new Error('The uploaded ZIP file is empty.');
  }

  for (const file of directory.files) {
    const targetPath = path.resolve(extractionPath, file.path);
    const relative = path.relative(extractionPath, targetPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      fs.rmSync(extractionPath, { recursive: true, force: true });
      throw new Error('Path traversal security violation detected in ZIP file.');
    }

    if (file.type === 'Directory' || file.path.endsWith('/')) {
      fs.mkdirSync(targetPath, { recursive: true });
      continue;
    }

    // Ensure target subdirectory structure exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Create write stream and write buffer contents
    const buffer = await file.buffer();
    fs.writeFileSync(targetPath, buffer);

    extractedFiles.push({
      path: targetPath,
      originalname: file.path
    });
  }

  if (extractedFiles.length === 0) {
    fs.rmSync(extractionPath, { recursive: true, force: true });
    throw new Error('The uploaded ZIP file does not contain any files.');
  }

  return {
    extractionPath,
    extractedFiles
  };
};
