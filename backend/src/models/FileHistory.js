const mongoose = require('mongoose');

const FileHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for guest uploads if we support them, otherwise required
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required']
  },
  processedName: {
    type: String,
    required: [true, 'Processed name is required']
  },
  toolUsed: {
    type: String,
    required: [true, 'Tool name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  downloadToken: {
    type: String,
    required: true
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900 // MongoDB TTL index to auto-delete document after 15 minutes (900 seconds)
  }
});

module.exports = mongoose.model('FileHistory', FileHistorySchema);
