const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const AppError = require('../utils/appError');

// Function to ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Base uploads directory
const baseUploadDir = path.join(__dirname, '../uploads');

// Ensure base uploads directory exists
ensureDirectoryExists(baseUploadDir);

// ✅ Configure storage with ALL file types including payout screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';

    // ✅ CHANGED: coverImage to coverImages (plural)
    if (file.fieldname === 'coverImages') folder += 'covers/';
    else if (file.fieldname === 'pdfFile') folder += 'pdfs/';
    else if (file.fieldname === 'textFile') folder += 'texts/';
    else if (file.fieldname === 'frontImage' || file.fieldname === 'backImage') folder += 'cnic/';
    else if (file.fieldname === 'image') folder += 'profiles/';
    else folder += 'others/';

    const fullPath = path.join(__dirname, '../', folder);

    // Ensure the specific directory exists
    ensureDirectoryExists(fullPath);

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // For payout screenshots, add user ID to filename for better organization
    if (file.fieldname === 'paymentScreenshot' && req.user) {
      const userId = req.user.id || 'unknown';
      cb(null, `payout-${userId}-${uniqueSuffix}${ext}`);
    } else {
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }
});

// ✅ File filter - updated with all supported file types
const fileFilter = (req, file, cb) => {
  // Check file types
  // ✅ CHANGED: coverImage to coverImages (plural)
  if (file.fieldname === 'coverImages' || file.fieldname === 'image' ||
    file.fieldname === 'frontImage' || file.fieldname === 'backImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Please upload only images', 400), false);
    }
  } else if (file.fieldname === 'pdfFile') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Please upload only PDF files', 400), false);
    }
  } else if (file.fieldname === 'textFile') {
    if (file.mimetype === 'text/plain' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new AppError('Please upload only text files', 400), false);
    }
  } else {
    cb(new AppError('Unsupported file type', 400), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ✅ Convert uploaded images to WebP format (optimize images)
const convertToWebP = async (req, res, next) => {
  try {
    // Skip if no files
    if (!req.file && !req.files) {
      return next();
    }

    const processFile = async (file) => {
      // Only convert image files (skip PDFs, text files, etc.)
      if (file && file.mimetype.startsWith('image/') && !file.mimetype.includes('webp')) {
        const newFilename = file.filename.replace(path.extname(file.filename), '.webp');
        const newPath = path.join(__dirname, '../', file.destination, newFilename);

        await sharp(file.path)
          .toFormat('webp')
          .webp({ quality: 80 })
          .toFile(newPath);

        // Delete original file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        // Update file object with WebP info
        file.filename = newFilename;
        file.path = newPath;
        file.mimetype = 'image/webp';
        file.originalname = file.originalname.replace(path.extname(file.originalname), '.webp');
      }
    };

    // Process single file
    if (req.file) await processFile(req.file);

    // Process multiple files
    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();

      for (const file of files) {
        await processFile(file);
      }
    }

    next();
  } catch (err) {
    console.error('Image conversion error:', err);
    next(new AppError('Error processing image file', 500));
  }
};

// ✅ FIXED: Middleware for book file uploads
const uploadFiles = [upload.fields([
  { name: 'coverImages', maxCount: 5 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'textFile', maxCount: 1 }
]), convertToWebP];

// ✅ Single file upload middleware
const uploadSingle = (fieldName) => {
  return [upload.single(fieldName), convertToWebP];
};

// ✅ Multiple files upload middleware
const uploadMultiple = (fields) => {
  return [upload.fields(fields), convertToWebP];
};

// ✅ CNIC upload middleware
const uploadCNIC = [upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 }
]), convertToWebP];

// ✅ Profile image upload middleware
const uploadProfile = [upload.single('image'), convertToWebP];

// ✅ ADDED: Payout screenshot upload middleware
const uploadPayoutScreenshot = [upload.single('paymentScreenshot'), convertToWebP];

// ✅ ADDED: Payout screenshot with multiple files
const uploadPayoutScreenshots = [upload.fields([
  { name: 'paymentScreenshot', maxCount: 3 } // Allow multiple screenshots if needed
]), convertToWebP];

// ✅ ADDED: Generic image upload for any image field
const uploadImage = (fieldName, maxCount = 1) => {
  if (maxCount > 1) {
    return [upload.array(fieldName, maxCount), convertToWebP];
  }
  return [upload.single(fieldName), convertToWebP];
};

module.exports = {
  upload,
  uploadFiles,
  uploadSingle,
  uploadMultiple,
  uploadCNIC,
  uploadProfile,
  convertToWebP
};