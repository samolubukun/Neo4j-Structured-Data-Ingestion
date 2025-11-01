const multer = require('multer');
const path = require('path');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    req.fileId = fileId;
    cb(null, `${fileId}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (config.upload.allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${config.upload.allowedFormats.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize }
});

exports.validateUpload = upload.single('file');