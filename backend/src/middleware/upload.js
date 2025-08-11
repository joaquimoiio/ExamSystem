const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize upload directories
const uploadPaths = {
  images: path.join(__dirname, '../uploads/images'),
  pdfs: path.join(__dirname, '../uploads/pdfs'),
  temp: path.join(__dirname, '../uploads/temp')
};

Object.values(uploadPaths).forEach(ensureDirectoryExists);

// Storage configuration for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPaths.images);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Storage configuration for temporary files
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPaths.temp);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt)'));
  }
};

// File filter for OCR images (for answer sheets)
const ocrImageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|tiff|bmp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for OCR (jpeg, jpg, png, tiff, bmp)'));
  }
};

// Multer configurations
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

const uploadDocument = multer({
  storage: tempStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

const uploadOCRImage = multer({
  storage: tempStorage,
  fileFilter: ocrImageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Allow multiple answer sheets
  }
});

// Multiple file upload for bulk operations
const uploadMultipleImages = multer({
  storage: tempStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 20 // Maximum 20 files
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large',
          error: 'File size exceeds the maximum allowed limit'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          error: 'Number of files exceeds the maximum allowed limit'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          error: 'Unexpected file field name'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Upload error',
          error: error.message
        });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      error: error.message
    });
  }

  next();
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to move file
const moveFile = (source, destination) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    ensureDirectoryExists(destDir);
    
    fs.renameSync(source, destination);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
};

// Cleanup temporary files older than 24 hours
const cleanupTempFiles = () => {
  try {
    const files = fs.readdirSync(uploadPaths.temp);
    const now = new Date();
    
    files.forEach(file => {
      const filePath = path.join(uploadPaths.temp, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (fileAge > maxAge) {
        deleteFile(filePath);
      }
    });
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
};

// Schedule cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
  uploadImage: uploadImage.single('image'),
  uploadDocument: uploadDocument.single('document'),
  uploadOCRImage: uploadOCRImage.array('images', 10),
  uploadMultipleImages: uploadMultipleImages.array('images', 20),
  handleUploadError,
  deleteFile,
  moveFile,
  cleanupTempFiles,
  uploadPaths
};