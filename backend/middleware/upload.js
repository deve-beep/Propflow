const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(ApiError.badRequest('Only image files are allowed'));
};

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(ApiError.badRequest('Unsupported file type'));
};

const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
});

const uploadAny = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
});

module.exports = { uploadImages, uploadAny };
