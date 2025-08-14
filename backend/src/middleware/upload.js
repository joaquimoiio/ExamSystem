const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../utils/appError');
const { MAX_FILE_SIZE, FILE_TYPES } = require('../utils/constants');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const documentsDir = path.join(uploadDir, 'documents');
const imagesDir = path.join(uploadDir, 'images');

[uploadDir, avatarDir, documentsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    
    switch (file.fieldname) {
      case 'avatar':
        uploadPath = avatarDir;
        break;
      case 'document':
        uploadPath = documentsDir;
        break;
      case 'image':
        uploadPath = imagesDir;
        break;
      default:
        uploadPath = uploadDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(extension, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedName}_${uniqueSuffix}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase().slice(1);
  
  let allowedTypes = [];
  
  switch (file.fieldname) {
    case 'avatar':
      allowedTypes = FILE_TYPES.IMAGE;
      break;
    case 'document':
      allowedTypes = [...FILE_TYPES.DOCUMENT, ...FILE_TYPES.SPREADSHEET];
      break;
    case 'image':
      allowedTypes = FILE_TYPES.IMAGE;
      break;
    default:
      allowedTypes = [...FILE_TYPES.IMAGE, ...FILE_TYPES.DOCUMENT, ...FILE_TYPES.SPREADSHEET];
  }
  
  if (allowedTypes.includes(extension)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per request
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new AppError('File too large. Maximum size is 5MB', 400));
      case 'LIMIT_FILE_COUNT':
        return next(new AppError('Too many files. Maximum 5 files allowed', 400));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new AppError('Unexpected file field', 400));
      default:
        return next(new AppError('File upload error: ' + err.message, 400));
    }
  }
  
  if (err) {
    return next(err);
  }
  
  next();
};

// Upload middlewares for different purposes
const uploadAvatar = [
  upload.single('avatar'),
  handleMulterError
];

const uploadDocument = [
  upload.single('document'),
  handleMulterError
];

const uploadImage = [
  upload.single('image'),
  handleMulterError
];

const uploadMultiple = [
  upload.array('files', 5),
  handleMulterError
];

const uploadFields = [
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 3 },
    { name: 'images', maxCount: 5 }
  ]),
  handleMulterError
];

// Helper function to delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Cleanup middleware for failed requests
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If error response and files were uploaded, clean them up
    if (res.statusCode >= 400 && req.files) {
      const filesToDelete = [];
      
      if (Array.isArray(req.files)) {
        filesToDelete.push(...req.files.map(file => file.path));
      } else if (typeof req.files === 'object') {
        Object.keys(req.files).forEach(key => {
          if (Array.isArray(req.files[key])) {
            filesToDelete.push(...req.files[key].map(file => file.path));
          }
        });
      }
      
      if (req.file) {
        filesToDelete.push(req.file.path);
      }
      
      // Delete files asynchronously
      filesToDelete.forEach(filePath => {
        deleteFile(filePath).catch(err => {
          console.error('Error deleting file:', filePath, err);
        });
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Validate uploaded file
const validateUploadedFile = (requiredField = null) => {
  return (req, res, next) => {
    if (requiredField && !req.file) {
      return next(new AppError(`${requiredField} file is required`, 400));
    }
    
    if (req.file) {
      // Additional validation can be added here
      const fileSize = req.file.size;
      const fileName = req.file.originalname;
      
      // Check file size again (just in case)
      if (fileSize > MAX_FILE_SIZE) {
        return next(new AppError('File size exceeds maximum limit', 400));
      }
      
      // Validate file name
      if (fileName.length > 255) {
        return next(new AppError('File name is too long', 400));
      }
      
      // Add file info to request
      req.fileInfo = {
        originalName: fileName,
        fileName: req.file.filename,
        path: req.file.path,
        size: fileSize,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      };
    }
    
    next();
  };
};

// Get file URL
const getFileUrl = (filename, type = 'general') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  switch (type) {
    case 'avatar':
      return `${baseUrl}/uploads/avatars/${filename}`;
    case 'document':
      return `${baseUrl}/uploads/documents/${filename}`;
    case 'image':
      return `${baseUrl}/uploads/images/${filename}`;
    default:
      return `${baseUrl}/uploads/${filename}`;
  }
};

module.exports = {
  upload,
  uploadAvatar,
  uploadDocument,
  uploadImage,
  uploadMultiple,
  uploadFields,
  handleMulterError,
  cleanupOnError,
  validateUploadedFile,
  deleteFile,
  getFileUrl
};