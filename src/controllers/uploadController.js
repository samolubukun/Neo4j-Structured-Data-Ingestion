const path = require('path');
const FileMetadata = require('../models/fileMetadata');
const fileService = require('../services/fileService');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = req.fileId;
    const metadata = {
      fileId,
      filename: req.file.originalname,
      format: path.extname(req.file.originalname).slice(1).toLowerCase(),
      size: req.file.size,
      path: req.file.path,
      uploadTimestamp: new Date().toISOString(),
      userId: req.body.userId || 'anonymous',
      status: 'uploaded'
    };

    await FileMetadata.save(metadata);

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId,
      metadata
    });
  } catch (error) {
    next(error);
  }
};

exports.getFileMetadata = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const metadata = await FileMetadata.findById(fileId);

    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(metadata);
  } catch (error) {
    next(error);
  }
};