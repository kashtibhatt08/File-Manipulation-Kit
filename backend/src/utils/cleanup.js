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
  
  fs.readdir(TEMP_DIR, (err, entries) => {
    if (err) {
      console.error(`Error reading temp directory: ${err.message}`);
      return;
    }

    const now = Date.now();
    
    entries.forEach(entry => {
      const entryPath = path.join(TEMP_DIR, entry);
      fs.stat(entryPath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for ${entry}: ${err.message}`);
          return;
        }

        const age = now - stats.mtimeMs;
        if (age <= FILE_LIFETIME_MS) return;

        if (stats.isDirectory()) {
          fs.rm(entryPath, { recursive: true, force: true }, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Error deleting expired directory ${entry}: ${unlinkErr.message}`);
            } else {
              console.log(`Successfully deleted expired temp directory: ${entry} (Age: ${Math.round(age / 60000)} mins)`);
            }
          });
          return;
        }

        if (stats.isFile()) {
          fs.unlink(entryPath, unlinkErr => {
            if (unlinkErr) {
              console.error(`Error deleting expired file ${entry}: ${unlinkErr.message}`);
            } else {
              console.log(`Successfully deleted expired file: ${entry} (Age: ${Math.round(age / 60000)} mins)`);
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
