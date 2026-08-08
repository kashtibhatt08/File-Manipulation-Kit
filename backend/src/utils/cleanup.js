const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');
const FILE_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes

const initializeTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`Created temporary directory at: ${TEMP_DIR}`);
  }
};

const cleanupFiles = () => {
  initializeTempDir();
  
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) {
      console.error(`Error reading temp directory: ${err.message}`);
      return;
    }

    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting file stats for ${file}: ${err.message}`);
          return;
        }

        const age = now - stats.mtimeMs;
        if (age > FILE_LIFETIME_MS) {
          fs.unlink(filePath, unlinkErr => {
            if (unlinkErr) {
              console.error(`Error deleting expired file ${file}: ${unlinkErr.message}`);
            } else {
              console.log(`Successfully deleted expired file: ${file} (Age: ${Math.round(age / 60000)} mins)`);
            }
          });
        }
      });
    });
  });
};

const startCleanupCron = () => {
  initializeTempDir();
  // Run every minute
  cron.schedule('* * * * *', () => {
    console.log('Running scheduled temporary file cleanup...');
    cleanupFiles();
  });
  console.log('Temporary file cleanup cron scheduled (Runs every minute)');
};

module.exports = {
  startCleanupCron,
  cleanupFiles,
  initializeTempDir
};
