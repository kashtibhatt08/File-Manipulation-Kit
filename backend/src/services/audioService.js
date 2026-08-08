const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

/**
 * Helper to verify FFmpeg availability
 */
const checkFFmpeg = () => {
  return new Promise((resolve) => {
    try {
      if (process.env.FFMPEG_PATH) {
        ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
      }
      ffmpeg.getAvailableFormats((err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } catch (e) {
      resolve(false);
    }
  });
};

/**
 * Trim audio file
 * @param {string} filePath - Absolute path to audio file
 * @param {number} start - Start time in seconds
 * @param {number} duration - Duration in seconds
 * @returns {Promise<string>} - Path to trimmed audio
 */
exports.trimAudio = async (filePath, start, duration) => {
  const parsedStart = parseFloat(start);
  const parsedDuration = parseFloat(duration);

  if (isNaN(parsedStart) || parsedStart < 0) {
    throw new Error('Start time must be 0 or greater.');
  }
  if (isNaN(parsedDuration) || parsedDuration <= 0) {
    throw new Error('Duration must be greater than 0.');
  }

  const ext = path.extname(filePath).toLowerCase();
  const outputFilename = `${uuidv4()}_trimmed${ext}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error('FFmpeg is not installed or is not available in PATH.');
  }

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .setStartTime(parsedStart)
      .setDuration(parsedDuration)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
};

/**
 * Convert audio format
 * @param {string} filePath - Absolute path to audio file
 * @param {string} format - Target format: mp3 or wav
 * @returns {Promise<string>} - Path to converted audio
 */
exports.convertAudio = async (filePath, format) => {
  const targetFormat = format.toLowerCase();
  const outputFilename = `${uuidv4()}_converted.${targetFormat}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error('FFmpeg is not installed or is not available in PATH.');
  }

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .toFormat(targetFormat)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
};

/**
 * Merge multiple audio files
 * @param {Array<string>} filePaths - Array of absolute paths to audio files
 * @returns {Promise<string>} - Path to merged audio file
 */
exports.mergeAudio = async (filePaths) => {
  if (filePaths.length === 0) {
    throw new Error('No files provided for merging');
  }

  const outputFilename = `${uuidv4()}_merged.mp3`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error('FFmpeg is not installed or is not available in PATH.');
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    
    filePaths.forEach(file => {
      command.input(file);
    });

    // Concatenate inputs and explicitly format to MP3
    command
      .toFormat('mp3')
      .mergeToFile(outputPath, TEMP_DIR)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
  });
};
