module.exports = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }

  res.status(err.statusCode || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred'
  });
};