const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/equipment', 'uploads/cnic', 'uploads/checklists', 'uploads/maintenance', 'uploads/profiles'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/';

        if (req.uploadType === 'equipment') {
            folder = 'uploads/equipment/';
        } else if (req.uploadType === 'cnic') {
            folder = 'uploads/cnic/';
        } else if (req.uploadType === 'checklist') {
            folder = 'uploads/checklists/';
        } else if (req.uploadType === 'maintenance') {
            folder = 'uploads/maintenance/';
        } else if (req.uploadType === 'profile') {
            folder = 'uploads/profiles/';
        }

        cb(null, path.join(__dirname, '../../', folder));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    }
});

// Middleware to set upload type
const setUploadType = (type) => (req, res, next) => {
    req.uploadType = type;
    next();
};

// Helper to get file URL
const getFileUrl = (filename, type = '') => {
    const folder = type ? `${type}/` : '';
    return `/uploads/${folder}${filename}`;
};

// Helper to delete file
const deleteFile = (filepath) => {
    const fullPath = path.join(__dirname, '../../', filepath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

module.exports = {
    upload,
    setUploadType,
    getFileUrl,
    deleteFile
};
