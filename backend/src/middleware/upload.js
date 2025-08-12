// backend/src/middleware/upload.js
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const { AppError } = require('../utils/AppError')

// Ensure upload directories exist
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath = 'src/uploads/'
    
    // Organize uploads by type
    if (file.fieldname === 'image') {
      uploadPath += 'images/'
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/'
    } else if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/'
    } else if (file.fieldname === 'import') {
      uploadPath += 'imports/'
    } else {
      uploadPath += 'misc/'
    }
    
    try {
      await ensureDirectoryExists(uploadPath)
      cb(null, uploadPath)
    } catch (error) {
      cb(new AppError('Erro ao criar diretório de upload', 500))
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_') // Sanitize filename
      .substring(0, 50) // Limit length
    
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  }
})

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    image: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf'
    ],
    spreadsheet: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    avatar: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ],
    import: [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  }

  const fileType = file.fieldname
  const allowedTypes = allowedMimes[fileType] || allowedMimes.document

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(`Tipo de arquivo não permitido para ${fileType}: ${file.mimetype}`, 400), false)
  }
}

// Size limits by file type
const getSizeLimit = (fieldname) => {
  const limits = {
    image: 5 * 1024 * 1024,     // 5MB for images
    avatar: 2 * 1024 * 1024,    // 2MB for avatars
    document: 10 * 1024 * 1024, // 10MB for documents
    import: 50 * 1024 * 1024,   // 50MB for import files
    default: 10 * 1024 * 1024   // 10MB default
  }
  
  return limits[fieldname] || limits.default
}

// Dynamic file size check
const dynamicFileFilter = (req, file, cb) => {
  const maxSize = getSizeLimit(file.fieldname)
  
  // Check file size (this is approximate, actual size checking happens in multer limits)
  if (file.size && file.size > maxSize) {
    return cb(new AppError(`Arquivo muito grande para ${file.fieldname}. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`, 400), false)
  }
  
  // Run regular file filter
  fileFilter(req, file, cb)
}

// Create multer instance with dynamic configuration
const createUpload = (options = {}) => {
  return multer({
    storage,
    fileFilter: options.customFilter || dynamicFileFilter,
    limits: {
      fileSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
      files: options.maxFiles || 5,
      fields: 10,
      fieldNameSize: 100,
      fieldSize: 1024 * 1024 // 1MB for field values
    }
  })
}

// Specific upload configurations
const upload = createUpload()

const uploadImage = upload.single('image')
const uploadAvatar = createUpload({ maxSize: 2 * 1024 * 1024 }).single('avatar')
const uploadDocument = upload.single('document')
const uploadImport = createUpload({ maxSize: 50 * 1024 * 1024 }).single('import')
const uploadMultiple = upload.array('files', 5)

// Mixed uploads (multiple file types)
const uploadMixed = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 },
  { name: 'files', maxCount: 5 }
])

// Error handling wrapper
const handleUploadError = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        let message = 'Erro no upload do arquivo'
        
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            message = `Arquivo muito grande. Máximo permitido: ${Math.round((err.limit || 10485760) / 1024 / 1024)}MB`
            break
          case 'LIMIT_FILE_COUNT':
            message = `Muitos arquivos. Máximo ${err.limit || 5} arquivos permitidos`
            break
          case 'LIMIT_UNEXPECTED_FILE':
            message = `Campo de arquivo inesperado: ${err.field}`
            break
          case 'LIMIT_PART_COUNT':
            message = 'Muitas partes no formulário'
            break
          case 'LIMIT_FIELD_KEY':
            message = 'Nome do campo muito longo'
            break
          case 'LIMIT_FIELD_VALUE':
            message = 'Valor do campo muito longo'
            break
          case 'LIMIT_FIELD_COUNT':
            message = 'Muitos campos no formulário'
            break
        }
        
        return next(new AppError(message, 400))
      } else if (err) {
        return next(err)
      }
      
      // Add file information to request
      if (req.file) {
        req.file.url = `/uploads/${path.relative('src/uploads', req.file.path)}`
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          req.files.forEach(file => {
            file.url = `/uploads/${path.relative('src/uploads', file.path)}`
          })
        } else {
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach(file => {
              file.url = `/uploads/${path.relative('src/uploads', file.path)}`
            })
          })
        }
      }
      
      next()
    })
  }
}

// File validation middleware
const validateFile = (options = {}) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      if (options.required) {
        return next(new AppError('Arquivo é obrigatório', 400))
      }
      return next()
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file]
    
    // Validate file types and sizes
    for (const file of files) {
      // Check if file exists and is readable
      if (!file || !file.path) {
        return next(new AppError('Arquivo inválido', 400))
      }
      
      // Additional security checks
      if (options.allowedExtensions) {
        const ext = path.extname(file.originalname).toLowerCase()
        if (!options.allowedExtensions.includes(ext)) {
          return next(new AppError(`Extensão de arquivo não permitida: ${ext}`, 400))
        }
      }
      
      // Check for potentially dangerous files
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js']
      const ext = path.extname(file.originalname).toLowerCase()
      if (dangerousExtensions.includes(ext)) {
        return next(new AppError('Tipo de arquivo perigoso não permitido', 400))
      }
    }
    
    next()
  }
}

// Cleanup uploaded files on error
const cleanupFiles = (req, res, next) => {
  const originalNext = next
  
  next = (err) => {
    if (err) {
      // Clean up uploaded files if there was an error
      const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file]
      
      files.filter(file => file && file.path).forEach(file => {
        fs.unlink(file.path).catch(() => {
          // Ignore cleanup errors
        })
      })
    }
    originalNext(err)
  }
  
  next()
}

// File processing middleware (for images)
const processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next()
  }
  
  try {
    // Here you could add image processing like resizing with Sharp
    // const sharp = require('sharp')
    // await sharp(req.file.path)
    //   .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    //   .jpeg({ quality: 85 })
    //   .toFile(req.file.path.replace(/\.[^/.]+$/, '_processed.jpg'))
    
    next()
  } catch (error) {
    next(new AppError('Erro ao processar imagem', 500))
  }
}

module.exports = {
  upload,
  uploadImage: handleUploadError(uploadImage),
  uploadAvatar: handleUploadError(uploadAvatar),
  uploadDocument: handleUploadError(uploadDocument),
  uploadImport: handleUploadError(uploadImport),
  uploadMultiple: handleUploadError(uploadMultiple),
  uploadMixed: handleUploadError(uploadMixed),
  validateFile,
  cleanupFiles,
  processImage,
  createUpload,
  handleUploadError
}