// backend/src/controllers/toolController.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FileHistory = require('../models/FileHistory');
const pdfService = require('../services/pdfService');
const imageService = require('../services/imageService');
const audioService = require('../services/audioService');
const zipService = require('../services/zipService');
const fileHelper = require('../utils/fileHelper');

const TEMP_DIR = path.join(__dirname, '..', '..', process.env.TEMP_UPLOAD_DIR || 'uploads/temp');

// Helper to record file history
const recordHistory = async (req, originalName, processedPath, toolUsed, mimeType) => {
  const stats = fs.statSync(processedPath);
  const downloadToken = uuidv4();

  const historyData = {
    originalName,
    processedName: path.basename(processedPath),
    toolUsed,
    fileSize: stats.size,
    mimeType,
    downloadToken,
    status: 'completed'
  };

  if (req.user) {
    historyData.user = req.user.id;
  }

  const history = await FileHistory.create(historyData);
  return history;
};

// ==========================================
// 1. PDF TOOLS
// ==========================================
exports.handlePDF = async (req, res, next) => {
  try {
    const firstFile = fileHelper.getFirstFile(req);
    const allFiles = fileHelper.getAllFiles(req);
    const { action } = req.body;
    let outputPath;
    let mimeType = 'application/pdf';
    let outputName = 'processed.pdf';
    let message = 'PDF processing completed';

    if (!allFiles.length && action !== 'imageToPDF') {
      return res.status(400).json({ success: false, error: 'Please upload files to process' });
    }

    switch (action) {
      case 'merge': {
        const filePaths = allFiles.map(f => f.path);
        outputPath = await pdfService.mergePDFs(filePaths);
        outputName = 'merged.pdf';
        break;
      }
      case 'split': {
        const filePath = firstFile.path;
        const { ranges } = req.body;
        const splitPaths = await pdfService.splitPDF(filePath, ranges);
        if (splitPaths.length === 1) {
          outputPath = splitPaths[0];
          outputName = 'split.pdf';
        } else {
          const zipFilesInput = splitPaths.map((p, idx) => ({ path: p, originalname: `split_page_${idx + 1}.pdf` }));
          outputPath = await zipService.zipFiles(zipFilesInput);
          outputName = 'split_pages.zip';
          mimeType = 'application/zip';
          fileHelper.cleanupFiles(splitPaths);
        }
        break;
      }
      case 'rotate': {
        const filePath = firstFile.path;
        const degrees = parseInt(req.body.degrees) || 90;
        outputPath = await pdfService.rotatePDF(filePath, degrees);
        outputName = 'rotated.pdf';
        break;
      }
      case 'compress': {
        const filePath = firstFile.path;
        const compressResult = await pdfService.compressPDF(filePath);
        outputPath = compressResult.path;
        outputName = 'compressed.pdf';
        message = compressResult.message;
        break;
      }
      case 'pdfToImage': {
        const filePath = firstFile.path;
        const imagePaths = await pdfService.pdfToImage(filePath);
        const zipFilesInput = imagePaths.map((p, idx) => ({ path: p, originalname: `page_${idx + 1}.png` }));
        outputPath = await zipService.zipFiles(zipFilesInput);
        outputName = 'pdf_pages.zip';
        mimeType = 'application/zip';
        fileHelper.cleanupFiles(imagePaths);
        break;
      }
      case 'imageToPDF': {
        if (!allFiles.length) {
          return res.status(400).json({ success: false, error: 'Please upload image files' });
        }
        const filePaths = allFiles.map(f => f.path);
        outputPath = await pdfService.imageToPDF(filePaths);
        outputName = 'images_to_pdf.pdf';
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid PDF action' });
    }

    const history = await recordHistory(req, outputName, outputPath, `PDF ${action.toUpperCase()}`, mimeType);
    fileHelper.cleanupFiles(allFiles.map(f => f.path));

    res.json({
      success: true,
      message,
      downloadUrl: `/api/files/download/${history.downloadToken}`,
      fileName: outputName
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. IMAGE TOOLS
// ==========================================
exports.handleImage = async (req, res, next) => {
  try {
    const firstFile = fileHelper.getFirstFile(req);
    const allFiles = fileHelper.getAllFiles(req);
    const { action } = req.body;
    let outputPath;
    let mimeType = 'image/png';
    let outputName = 'processed_image.png';

    if (!firstFile) {
      return res.status(400).json({ success: false, error: 'Please upload an image file to process' });
    }

    const filePath = firstFile.path;

    switch (action) {
      case 'compress': {
        const quality = parseInt(req.body.quality) || 80;
        outputPath = await imageService.compressImage(filePath, quality);
        outputName = `compressed_${firstFile.originalname}`;
        mimeType = firstFile.mimetype;
        break;
      }
      case 'resize': {
        const { width, height, fit } = req.body;
        outputPath = await imageService.resizeImage(filePath, width, height, fit);
        outputName = `resized_${firstFile.originalname}`;
        mimeType = firstFile.mimetype;
        break;
      }
      case 'crop': {
        const { width, height, left, top } = req.body;
        outputPath = await imageService.cropImage(filePath, width, height, left, top);
        outputName = `cropped_${firstFile.originalname}`;
        mimeType = firstFile.mimetype;
        break;
      }
      case 'convert': {
        const { format } = req.body;
        outputPath = await imageService.convertImage(filePath, format);
        outputName = `converted_${path.basename(firstFile.originalname, path.extname(firstFile.originalname))}.${format}`;
        mimeType = `image/${format}`;
        break;
      }
      case 'watermark': {
        const { text, position } = req.body;
        outputPath = await imageService.watermarkImage(filePath, text, position);
        outputName = `watermarked_${firstFile.originalname}`;
        mimeType = firstFile.mimetype;
        break;
      }
      case 'removeBackground': {
        outputPath = await imageService.removeBackground(filePath);
        outputName = `no_bg_${path.basename(firstFile.originalname, path.extname(firstFile.originalname))}.png`;
        mimeType = 'image/png';
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid Image action' });
    }

    const history = await recordHistory(req, outputName, outputPath, `IMAGE ${action.toUpperCase()}`, mimeType);
    fileHelper.cleanupFiles(allFiles.map(f => f.path));

    res.json({
      success: true,
      message: 'Image processing completed',
      downloadUrl: `/api/files/download/${history.downloadToken}`,
      fileName: outputName
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. AUDIO TOOLS
// ==========================================
exports.handleAudio = async (req, res, next) => {
  try {
    const firstFile = fileHelper.getFirstFile(req);
    const allFiles = fileHelper.getAllFiles(req);
    const { action } = req.body;
    let outputPath;
    let mimeType = 'audio/mp3';
    let outputName = 'processed_audio.mp3';

    if (!allFiles.length) {
      return res.status(400).json({ success: false, error: 'Please upload audio files to process' });
    }

    switch (action) {
      case 'trim': {
        const filePath = firstFile.path;
        const { start, duration } = req.body;
        outputPath = await audioService.trimAudio(filePath, start, duration);
        outputName = `trimmed_${firstFile.originalname}`;
        mimeType = firstFile.mimetype;
        break;
      }
      case 'convert': {
        const filePath = firstFile.path;
        const { format } = req.body;
        outputPath = await audioService.convertAudio(filePath, format);
        outputName = `converted_${path.basename(firstFile.originalname, path.extname(firstFile.originalname))}.${format}`;
        mimeType = `audio/${format}`;
        break;
      }
      case 'merge': {
        const filePaths = allFiles.map(f => f.path);
        outputPath = await audioService.mergeAudio(filePaths);
        outputName = 'merged_audio.mp3';
        mimeType = 'audio/mpeg';
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid Audio action' });
    }

    const history = await recordHistory(req, outputName, outputPath, `AUDIO ${action.toUpperCase()}`, mimeType);
    fileHelper.cleanupFiles(allFiles.map(f => f.path));

    res.json({
      success: true,
      message: 'Audio processing completed',
      downloadUrl: `/api/files/download/${history.downloadToken}`,
      fileName: outputName
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ZIP TOOLS
// ==========================================
exports.handleZip = async (req, res, next) => {
  try {
    const firstFile = fileHelper.getFirstFile(req);
    const allFiles = fileHelper.getAllFiles(req);
    const { action } = req.body;
    let outputPath;
    let mimeType = 'application/zip';
    let outputName = 'archive.zip';

    switch (action) {
      case 'zip': {
        if (!allFiles.length) {
          return res.status(400).json({ success: false, error: 'Please upload files to zip' });
        }
        const zipFilesInput = allFiles.map(f => ({ path: f.path, originalname: f.originalname }));
        outputPath = await zipService.zipFiles(zipFilesInput);
        outputName = 'archive.zip';
        break;
      }
      case 'unzip': {
        if (!firstFile) {
          return res.status(400).json({ success: false, error: 'Please upload a ZIP file to extract' });
        }
        const filePath = firstFile.path;
        const result = await zipService.unzipFile(filePath);
        const { extractionPath, extractedFiles } = result;
        
        const zipFilesInput = extractedFiles.map(f => ({ path: f.path, originalname: f.originalname }));
        outputPath = await zipService.zipFiles(zipFilesInput);
        outputName = 'extracted_contents.zip';
        
        // Recursively remove the extraction directory and all its files
        fs.rmSync(extractionPath, { recursive: true, force: true });
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid ZIP action' });
    }

    const history = await recordHistory(req, outputName, outputPath, `ZIP ${action.toUpperCase()}`, mimeType);
    fileHelper.cleanupFiles(allFiles.map(f => f.path));

    res.json({
      success: true,
      message: 'ZIP processing completed',
      downloadUrl: `/api/files/download/${history.downloadToken}`,
      fileName: outputName
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. DOWNLOAD & HISTORY SYSTEM
// ==========================================
exports.downloadFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const history = await FileHistory.findOne({ downloadToken: token });
    if (!history) {
      return res.status(404).json({ success: false, error: 'Link expired or file does not exist' });
    }
    const filePath = path.join(TEMP_DIR, history.processedName);
    if (!fs.existsSync(filePath)) {
      return res.status(410).json({ success: false, error: 'File deleted from disk due to privacy duration timeout' });
    }
    res.download(filePath, history.originalName, async (err) => {
      if (!err || err.code === 'ECONNRESET') {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting file post-download: ${unlinkErr.message}`);
        });
        history.isDownloaded = true;
        await FileHistory.findByIdAndDelete(history._id);
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    let histories;
    if (req.user) {
      histories = await FileHistory.find({ user: req.user.id }).sort('-createdAt');
    } else {
      histories = [];
    }
    res.status(200).json({ success: true, data: histories });
  } catch (error) {
    next(error);
  }
};
