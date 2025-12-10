const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload, setUploadType } = require('../middleware/upload');

// Register
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('phone').isMobilePhone(),
        body('password').isLength({ min: 6 }),
        body('firstName').notEmpty().trim(),
        body('lastName').notEmpty().trim(),
        body('role').isIn(['renter', 'owner'])
    ],
    validate,
    authController.register
);

// Verify OTP
router.post('/verify-otp',
    [
        body('email').isEmail().normalizeEmail(),
        body('otp').isLength({ min: 6, max: 6 })
    ],
    validate,
    authController.verifyOTP
);

// Resend OTP
router.post('/resend-otp',
    [
        body('email').isEmail().normalizeEmail(),
        body('purpose').optional().isIn(['email_verify', 'password_reset'])
    ],
    validate,
    authController.resendOTP
);

// Forgot Password
router.post('/forgot-password',
    [
        body('email').isEmail().normalizeEmail()
    ],
    validate,
    authController.forgotPassword
);

// Reset Password
router.post('/reset-password',
    [
        body('email').isEmail().normalizeEmail(),
        body('otp').isLength({ min: 6, max: 6 }),
        body('newPassword').isLength({ min: 6 })
    ],
    validate,
    authController.resetPassword
);

// Login
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    validate,
    authController.login
);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

router.put('/profile',
    authenticate,
    [
        body('phone').optional().isMobilePhone(),
        body('firstName').optional().trim(),
        body('lastName').optional().trim()
    ],
    validate,
    authController.updateProfile
);

// Upload CNIC (Public - for registration pending users, uses email)
router.post('/upload-cnic-public',
    setUploadType('cnic'),
    upload.fields([
        { name: 'cnicFront', maxCount: 1 },
        { name: 'cnicBack', maxCount: 1 }
    ]),
    authController.uploadCNICPublic
);

// Upload CNIC (Authenticated - for logged in users)
router.post('/upload-cnic',
    authenticate,
    setUploadType('cnic'),
    upload.fields([
        { name: 'cnicFront', maxCount: 1 },
        { name: 'cnicBack', maxCount: 1 }
    ]),
    authController.uploadCNIC
);

// Upload profile image
router.post('/upload-profile-image',
    authenticate,
    setUploadType('profile'),
    upload.single('profileImage'),
    authController.uploadProfileImage
);

// Change password
router.post('/change-password',
    authenticate,
    [
        body('currentPassword').notEmpty(),
        body('newPassword').isLength({ min: 6 })
    ],
    validate,
    authController.changePassword
);

// Request OTP for password change
router.post('/request-password-change-otp',
    authenticate,
    authController.requestPasswordChangeOTP
);

// Change password with OTP
router.post('/change-password-otp',
    authenticate,
    [
        body('otp').isLength({ min: 6, max: 6 }),
        body('newPassword').isLength({ min: 6 })
    ],
    validate,
    authController.changePasswordWithOTP
);

module.exports = router;

