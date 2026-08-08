const { PDFDocument, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

/**
 * Merge multiple PDF files into one
 * @param {Array<string>} filePaths - Array of absolute file paths to merge
 * @returns {Promise<string>} - Path to the merged PDF file
 */
exports.mergePDFs = async (filePaths) => {
  const mergedPdf = await PDFDocument.create();
  
  for (const filePath of filePaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  const outputFilename = `${uuidv4()}_merged.pdf`;
  const outputPath = path.join(TEMP_DIR, outputFilename);
  fs.writeFileSync(outputPath, mergedPdfBytes);
  
  return outputPath;
};

/**
 * Split a PDF file into individual pages or page ranges
 * @param {string} filePath - Absolute path to the PDF
 * @param {string} ranges - e.g., "1-3, 5, 8-10" or "all"
 * @returns {Promise<Array<string>>} - Array of paths of the split PDF files
 */
exports.splitPDF = async (filePath, ranges = 'all') => {
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  const totalPages = pdf.getPageCount();
  const outputFiles = [];
  
  let pagesToExtract = [];
  const cleanRanges = ranges.trim().toLowerCase();
  
  if (cleanRanges === 'all') {
    for (let i = 0; i < totalPages; i++) {
      pagesToExtract.push([i]);
    }
  } else {
    const parts = cleanRanges.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) {
        throw new Error('Range list contains an empty or malformed segment.');
      }
      
      if (trimmed.includes('-')) {
        const rangeParts = trimmed.split('-');
        if (rangeParts.length !== 2) {
          throw new Error(`Invalid range format: "${trimmed}". Expected "start-end".`);
        }
        
        const start = Number(rangeParts[0].trim());
        const end = Number(rangeParts[1].trim());
        
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid numbers in range: "${trimmed}".`);
        }
        if (start <= 0 || end <= 0) {
          throw new Error(`Page numbers must be positive integers: "${trimmed}".`);
        }
        if (start > totalPages || end > totalPages) {
          throw new Error(`Page numbers out of range (PDF only has ${totalPages} pages): "${trimmed}".`);
        }
        if (start > end) {
          throw new Error(`Reversed range is invalid: "${trimmed}". Start page must be less than or equal to end page.`);
        }
        
        const rangePages = [];
        for (let i = start - 1; i <= end - 1; i++) {
          rangePages.push(i);
        }
        pagesToExtract.push(rangePages);
      } else {
        const pageNum = Number(trimmed);
        if (isNaN(pageNum)) {
          throw new Error(`Invalid page number: "${trimmed}".`);
        }
        if (pageNum <= 0) {
          throw new Error(`Page number must be positive: "${trimmed}".`);
        }
        if (pageNum > totalPages) {
          throw new Error(`Page number out of range (PDF only has ${totalPages} pages): "${trimmed}".`);
        }
        pagesToExtract.push([pageNum - 1]);
      }
    }
  }

  if (pagesToExtract.length === 0) {
    throw new Error('No valid pages selected to split.');
  }

  for (let i = 0; i < pagesToExtract.length; i++) {
    const indices = pagesToExtract[i];
    const subPdf = await PDFDocument.create();
    const copiedPages = await subPdf.copyPages(pdf, indices);
    copiedPages.forEach((page) => subPdf.addPage(page));
    
    const subPdfBytes = await subPdf.save();
    const outputFilename = `${uuidv4()}_split_part_${i + 1}.pdf`;
    const outputPath = path.join(TEMP_DIR, outputFilename);
    fs.writeFileSync(outputPath, subPdfBytes);
    outputFiles.push(outputPath);
  }
  
  return outputFiles;
};

/**
 * Rotate pages of a PDF
 * @param {string} filePath - Absolute path to PDF
 * @param {number} rotationDegrees - 90, 180, or 270
 * @returns {Promise<string>} - Path to the rotated PDF
 */
exports.rotatePDF = async (filePath, rotationDegrees) => {
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();
  
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
  });
  
  const rotatedBytes = await pdf.save();
  const outputFilename = `${uuidv4()}_rotated.pdf`;
  const outputPath = path.join(TEMP_DIR, outputFilename);
  fs.writeFileSync(outputPath, rotatedBytes);
  
  return outputPath;
};

/**
 * Create a PDF document from an array of image files
 * @param {Array<string>} filePaths - Array of absolute paths to images
 * @returns {Promise<string>} - Path to the generated PDF file
 */
exports.imageToPDF = async (filePaths) => {
  const pdfDoc = await PDFDocument.create();
  
  for (const filePath of filePaths) {
    try {
      // Normalize any input image (JPG, PNG, WEBP, GIF, etc.) to a standard PNG buffer using sharp
      const pngBuffer = await sharp(filePath).png().toBuffer();
      const embeddedImage = await pdfDoc.embedPng(pngBuffer);
      
      const { width, height } = embeddedImage.scale(1.0);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height
      });
    } catch (err) {
      console.error(`Error processing image ${filePath} in imageToPDF:`, err.message);
      throw new Error(`Failed to process image ${path.basename(filePath)}: ${err.message}`);
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const outputFilename = `${uuidv4()}_images_to.pdf`;
  const outputPath = path.join(TEMP_DIR, outputFilename);
  fs.writeFileSync(outputPath, pdfBytes);
  
  return outputPath;
};

/**
 * Compress a PDF by re-saving it with compression options
 * @param {string} filePath - Absolute path to PDF
 * @returns {Promise<string>} - Path to the compressed PDF file
 */
exports.compressPDF = async (filePath) => {
  const originalStats = fs.statSync(filePath);
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // pdf-lib optimizes and compresses duplicate objects automatically upon saving with useObjectStreams
  const compressedBytes = await pdf.save({ useObjectStreams: true });
  const outputFilename = `${uuidv4()}_compressed.pdf`;
  const outputPath = path.join(TEMP_DIR, outputFilename);
  fs.writeFileSync(outputPath, compressedBytes);
  
  const compressedStats = fs.statSync(outputPath);
  
  let message = 'PDF structure optimized successfully.';
  let finalPath = outputPath;
  
  if (compressedStats.size >= originalStats.size) {
    // If the compressed version is not smaller, delete it and copy the original file
    fs.unlinkSync(outputPath);
    
    const copiedFilename = `${uuidv4()}_compressed.pdf`;
    const copiedPath = path.join(TEMP_DIR, copiedFilename);
    fs.copyFileSync(filePath, copiedPath);
    
    finalPath = copiedPath;
    message = 'PDF was already optimized. No further compression was possible.';
  } else {
    const reductionPercent = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);
    message = `PDF compressed successfully by ${reductionPercent}%.`;
  }
  
  return {
    path: finalPath,
    message
  };
};

/**
 * Convert PDF to Image - Actual Page Rendering
 * Renders each PDF page view into a separate high-resolution PNG file.
 * @param {string} filePath - Absolute path to PDF
 * @returns {Promise<Array<string>>} - Array of paths of generated PNG images
 */
exports.pdfToImage = async (filePath) => {
  const { pdf } = require('pdf-to-img');
  
  const document = await pdf(filePath, { scale: 2 });
  const imagePaths = [];
  let counter = 1;

  for await (const image of document) {
    const outputFilename = `${uuidv4()}_page_${counter}.png`;
    const outputPath = path.join(TEMP_DIR, outputFilename);
    fs.writeFileSync(outputPath, image);
    imagePaths.push(outputPath);
    counter++;
  }

  return imagePaths;
};
