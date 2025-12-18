const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Check if Cloudinary is configured
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

// Cloudinary upload function
const uploadToCloudinary = async (filePath, folder) => {
    if (!useCloudinary) {
        console.log('⚠️ Cloudinary not configured, using local storage');
        return null;
    }

    try {
        const cloudinary = require('cloudinary').v2;

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const result = await cloudinary.uploader.upload(filePath, {
            folder: `equiprent/${folder}`,
            resource_type: 'image'
        });

        // Delete local file after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.log('☁️ Uploaded to Cloudinary:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload failed:', error.message);
        throw error;
    }
};

// Ensure upload directories exist (for temporary storage before Cloudinary upload)
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

// Helper to get file URL (for local storage fallback)
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

// Delete from Cloudinary
const deleteFromCloudinary = async (url) => {
    if (!useCloudinary || !url || !url.includes('cloudinary')) return;

    try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // Extract public_id from URL
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = `equiprent/${parts[parts.length - 2]}/${filename.split('.')[0]}`;

        await cloudinary.uploader.destroy(publicId);
        console.log('☁️ Deleted from Cloudinary:', publicId);
    } catch (error) {
        console.error('❌ Cloudinary delete failed:', error.message);
    }
};

module.exports = {
    upload,
    setUploadType,
    getFileUrl,
    deleteFile,
    uploadToCloudinary,
    deleteFromCloudinary,
    useCloudinary
};
