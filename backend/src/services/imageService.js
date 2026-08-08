const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

/**
 * Compress an image
 * @param {string} filePath - Absolute file path
 * @param {number} quality - Quality percentage (1-100)
 * @returns {Promise<string>} - Path to the compressed image
 */
exports.compressImage = async (filePath, quality = 80) => {
  const ext = path.extname(filePath).toLowerCase();
  const outputFilename = `${uuidv4()}_compressed${ext}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);
  
  let pipeline = sharp(filePath);
  
  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality });
  } else if (ext === '.png') {
    // PNG is lossless, compression level is 0-9. Maps quality 100 -> level 9
    const compressionLevel = Math.min(Math.floor((100 - quality) / 10), 9);
    pipeline = pipeline.png({ compressionLevel, palette: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality });
  }

  await pipeline.toFile(outputPath);
  return outputPath;
};

/**
 * Resize an image
 * @param {string} filePath - Absolute file path
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {string} fit - Fit option: cover, contain, fill, inside, outside
 * @returns {Promise<string>} - Path to the resized image
 */
exports.resizeImage = async (filePath, width, height, fit = 'cover') => {
  const parsedWidth = width ? parseInt(width) : null;
  const parsedHeight = height ? parseInt(height) : null;

  if (!parsedWidth && !parsedHeight) {
    throw new Error('At least one of width or height must be specified for resizing.');
  }

  if ((width && (isNaN(parsedWidth) || parsedWidth <= 0)) ||
      (height && (isNaN(parsedHeight) || parsedHeight <= 0))) {
    throw new Error('Width and height must be valid positive integers.');
  }

  const ext = path.extname(filePath).toLowerCase();
  const outputFilename = `${uuidv4()}_resized${ext}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);
  
  const resizeOptions = { fit };
  if (parsedWidth) resizeOptions.width = parsedWidth;
  if (parsedHeight) resizeOptions.height = parsedHeight;

  await sharp(filePath)
    .resize(resizeOptions)
    .toFile(outputPath);

  return outputPath;
};

/**
 * Crop an image
 * @param {string} filePath - Absolute file path
 * @param {number} width - Crop width
 * @param {number} height - Crop height
 * @param {number} left - Left offset
 * @param {number} top - Top offset
 * @returns {Promise<string>} - Path to cropped image
 */
exports.cropImage = async (filePath, width, height, left, top) => {
  const parsedWidth = parseInt(width);
  const parsedHeight = parseInt(height);
  const parsedLeft = parseInt(left);
  const parsedTop = parseInt(top);

  if (isNaN(parsedWidth) || parsedWidth <= 0) {
    throw new Error('Crop width must be a valid positive integer.');
  }
  if (isNaN(parsedHeight) || parsedHeight <= 0) {
    throw new Error('Crop height must be a valid positive integer.');
  }
  if (isNaN(parsedLeft) || parsedLeft < 0) {
    throw new Error('Left offset must be a non-negative integer.');
  }
  if (isNaN(parsedTop) || parsedTop < 0) {
    throw new Error('Top offset must be a non-negative integer.');
  }

  const metadata = await sharp(filePath).metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;

  if (parsedLeft + parsedWidth > imgWidth) {
    throw new Error(`Crop area width (${parsedWidth}) and left offset (${parsedLeft}) exceeds original image width (${imgWidth}).`);
  }
  if (parsedTop + parsedHeight > imgHeight) {
    throw new Error(`Crop area height (${parsedHeight}) and top offset (${parsedTop}) exceeds original image height (${imgHeight}).`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const outputFilename = `${uuidv4()}_cropped${ext}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  await sharp(filePath)
    .extract({
      width: parsedWidth,
      height: parsedHeight,
      left: parsedLeft,
      top: parsedTop
    })
    .toFile(outputPath);

  return outputPath;
};

/**
 * Convert image format
 * @param {string} filePath - Absolute file path
 * @param {string} format - Target format: png, jpeg, webp
 * @returns {Promise<string>} - Path to converted image
 */
exports.convertImage = async (filePath, format) => {
  const targetFormat = format.toLowerCase();
  const outputFilename = `${uuidv4()}_converted.${targetFormat}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  let pipeline = sharp(filePath);

  if (targetFormat === 'png') {
    pipeline = pipeline.png();
  } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
    pipeline = pipeline.jpeg();
  } else if (targetFormat === 'webp') {
    pipeline = pipeline.webp();
  } else {
    throw new Error(`Unsupported output format: ${format}`);
  }

  await pipeline.toFile(outputPath);
  return outputPath;
};

/**
 * Overlay a text watermark on an image
 * @param {string} filePath - Absolute file path
 * @param {string} text - Watermark text
 * @param {string} position - center, bottom-right, bottom-left, top-right, top-left
 * @returns {Promise<string>} - Path to watermarked image
 */
exports.watermarkImage = async (filePath, text, position = 'bottom-right') => {
  const ext = path.extname(filePath).toLowerCase();
  const outputFilename = `${uuidv4()}_watermarked${ext}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  const metadata = await sharp(filePath).metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Render text to SVG buffer
  const fontSize = Math.max(Math.floor(width * 0.03), 16);
  const padding = fontSize;

  let x = width - (text.length * (fontSize * 0.6)) - padding;
  let y = height - padding;

  if (position === 'center') {
    x = (width / 2) - ((text.length * (fontSize * 0.6)) / 2);
    y = height / 2;
  } else if (position === 'bottom-left') {
    x = padding;
    y = height - padding;
  } else if (position === 'top-left') {
    x = padding;
    y = fontSize + padding;
  } else if (position === 'top-right') {
    x = width - (text.length * (fontSize * 0.6)) - padding;
    y = fontSize + padding;
  }

  // Ensure coordinates are within bounds
  x = Math.max(0, x);
  y = Math.max(0, y);

  const svgWatermark = Buffer.from(`
    <svg width="${width}" height="${height}">
      <text x="${x}" y="${y}" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}px" 
            fill="rgba(255, 255, 255, 0.4)" 
            stroke="rgba(0, 0, 0, 0.3)" 
            stroke-width="1">
        ${text}
      </text>
    </svg>
  `);

  await sharp(filePath)
    .composite([{ input: svgWatermark, top: 0, left: 0 }])
    .toFile(outputPath);

  return outputPath;
};
