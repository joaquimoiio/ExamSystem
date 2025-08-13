const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { AppError } = require('../utils/appError');

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'src/uploads',
    'src/uploads/documents',
    'src/uploads/images',
    'src/uploads/avatars',
    'src/uploads/ocr',
    'src/uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Initialize upload directories
ensureUploadDirs();

// Configure storage
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
    }
  });
};

// File filters
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Tipo de arquivo não permitido: ${file.mimetype}`, 400), false);
    }
  };
};

// Image file filter
const imageFilter = createFileFilter([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]);

// Document file filter
const documentFilter = createFileFilter([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json',
  'text/plain'
]);

// Import file filter (for question imports)
const importFilter = createFileFilter([
  'text/csv',
  'application/json',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

// Base upload configuration
const createUpload = (options = {}) => {
  const {
    destination = 'src/uploads/temp',
    fileFilter = null,
    limits = {
      fileSize: 10 * 1024 * 1024, // 10MB default
      files: 5
    }
  } = options;

  return multer({
    storage: createStorage(destination),
    fileFilter,
    limits
  });
};

// Specific upload configurations
const upload = createUpload();

const uploadImage = createUpload({
  destination: 'src/uploads/images',
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
    files: 1
  }
});

const uploadAvatar = createUpload({
  destination: 'src/uploads/avatars',
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
    files: 1
  }
});

const uploadDocument = createUpload({
  destination: 'src/uploads/documents',
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
    files: 1
  }
});

const uploadImport = createUpload({
  destination: 'src/uploads/temp',
  fileFilter: importFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for imports
    files: 1
  }
});

const uploadOCRImage = createUpload({
  destination: 'src/uploads/ocr',
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
    files: 10 // Allow multiple images for OCR
  }
});

const uploadMultiple = createUpload({
  destination: 'src/uploads/temp',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10
  }
});

const uploadMixed = createUpload({
  destination: 'src/uploads/temp',
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});

// Error handling middleware
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        let message = 'Erro no upload do arquivo';
        
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            message = `Arquivo muito grande. Máximo permitido: ${Math.round((err.limit || 10485760) / 1024 / 1024)}MB`;
            break;
          case 'LIMIT_FILE_COUNT':
            message = `Muitos arquivos. Máximo ${err.limit || 5} arquivos permitidos`;
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            message = `Campo de arquivo inesperado: ${err.field}`;
            break;
          case 'LIMIT_PART_COUNT':
            message = 'Muitas partes no formulário';
            break;
          case 'LIMIT_FIELD_KEY':
            message = 'Nome do campo muito longo';
            break;
          case 'LIMIT_FIELD_VALUE':
            message = 'Valor do campo muito longo';
            break;
          case 'LIMIT_FIELD_COUNT':
            message = 'Muitos campos no formulário';
            break;
        }
        
        return next(new AppError(message, 400));
      } else if (err) {
        return next(err);
      }
      
      // Add file URL information to request
      if (req.file) {
        req.file.url = `/uploads/${path.relative('src/uploads', req.file.path)}`;
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          req.files.forEach(file => {
            file.url = `/uploads/${path.relative('src/uploads', file.path)}`;
          });
        } else {
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach(file => {
              file.url = `/uploads/${path.relative('src/uploads', file.path)}`;
            });
          });
        }
      }
      
      next();
    });
  };
};

// File validation middleware
const validateFile = (options = {}) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      if (options.required) {
        return next(new AppError('Arquivo é obrigatório', 400));
      }
      return next();
    }
    
    const files = req.files ? 
      (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
      [req.file];
    
    // Validate file types and sizes
    for (const file of files) {
      // Check if file exists and is readable
      if (!file || !file.path) {
        return next(new AppError('Arquivo inválido', 400));
      }
      
      // Additional security checks
      if (options.allowedExtensions) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!options.allowedExtensions.includes(ext)) {
          return next(new AppError(`Extensão de arquivo não permitida: ${ext}`, 400));
        }
      }
      
      // Check for potentially dangerous files
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (dangerousExtensions.includes(ext)) {
        return next(new AppError('Tipo de arquivo perigoso não permitido', 400));
      }
    }
    
    next();
  };
};

// Cleanup uploaded files on error
const cleanupFiles = (req, res, next) => {
  const originalNext = next;
  
  next = (err) => {
    if (err) {
      // Clean up uploaded files if there was an error
      const files = req.files ? 
        (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : 
        [req.file];
      
      files.filter(file => file && file.path).forEach(file => {
        fs.unlink(file.path).catch(() => {
          // Ignore cleanup errors
        });
      });
    }
    originalNext(err);
  };
  
  next();
};

// File processing middleware (for images)
const processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }
  
  try {
    // Here you could add image processing like resizing with Sharp
    // const sharp = require('sharp')
    // await sharp(req.file.path)
    //   .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    //   .jpeg({ quality: 85 })
    //   .toFile(req.file.path.replace(/\.[^/.]+$/, '_processed.jpg'))
    
    next();
  } catch (error) {
    next(new AppError('Erro ao processar imagem', 500));
  }
};

module.exports = {
  upload,
  uploadImage: handleUploadError(uploadImage.single('image')),
  uploadAvatar: handleUploadError(uploadAvatar.single('avatar')),
  uploadDocument: handleUploadError(uploadDocument.single('document')),
  uploadImport: handleUploadError(uploadImport.single('file')),
  uploadOCRImage: handleUploadError(uploadOCRImage.array('images', 10)),
  uploadMultiple: handleUploadError(uploadMultiple.array('files', 10)),
  uploadMixed: handleUploadError(uploadMixed.fields([
    { name: 'documents', maxCount: 5 },
    { name: 'images', maxCount: 5 }
  ])),
  validateFile,
  cleanupFiles,
  processImage,
  createUpload,
  handleUploadError
};