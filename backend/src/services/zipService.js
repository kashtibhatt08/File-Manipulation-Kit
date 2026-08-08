const archiver = require('archiver');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

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

    // Add each file to the zip archive
    files.forEach(file => {
      archive.file(file.path, { name: file.originalname });
    });

    archive.finalize();
  });
};

/**
 * Unzip a single zip file and return paths to extracted contents
 * @param {string} filePath - Absolute path to zip file
 * @returns {Promise<Array<Object>>} - Extracted files with path and originalName
 */
exports.unzipFile = async (filePath) => {
  const extractedFiles = [];
  const extractionDirName = `unzipped_${uuidv4()}`;
  const extractionPath = path.join(TEMP_DIR, extractionDirName);

  // Ensure unique subfolder exists for extracted contents to prevent collision
  fs.mkdirSync(extractionPath, { recursive: true });

  const directory = await unzipper.Open.file(filePath);
  
  for (const file of directory.files) {
    // Prevent directory traversal vulnerabilities
    const safePath = path.join(extractionPath, path.basename(file.path));
    
    // Create write stream and write buffer contents
    const buffer = await file.buffer();
    fs.writeFileSync(safePath, buffer);

    extractedFiles.push({
      path: safePath,
      originalname: file.path
    });
  }

  // We will ZIP the extracted files back or present them. Or return files details.
  // In typical web usage, unzipping returns a structure of files. We'll return the list of paths.
  return extractedFiles;
};
