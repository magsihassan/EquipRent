const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');
const { sendEmail, emailTemplates, generateOTP } = require('../utils/email');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// OTP expiry time (10 minutes)
const OTP_EXPIRY_MINUTES = 10;

// Register new user
const register = async (req, res, next) => {
    try {
        const {
            email,
            phone,
            password,
            role,
            firstName,
            lastName,
            companyName,
            address,
            city,
            state,
            country
        } = req.body;

        // Check if email exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: { message: 'Email already registered' }
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Create user with pending status
        const result = await query(
            `INSERT INTO users (
                email, phone, password_hash, role, first_name, last_name,
                company_name, address, city, state, country,
                otp_code, otp_expires_at, otp_purpose, email_verified, registration_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING id, email, role, first_name, last_name`,
            [
                email.toLowerCase(),
                phone,
                passwordHash,
                role || 'renter',
                firstName,
                lastName,
                companyName,
                address,
                city,
                state,
                country || 'Pakistan',
                otp,
                otpExpiresAt,
                'email_verify',
                false,
                'pending'
            ]
        );

        const user = result.rows[0];

        // Send OTP email
        try {
            const emailContent = emailTemplates.otpVerification(otp, firstName);
            await sendEmail({
                to: email,
                subject: emailContent.subject,
                html: emailContent.html
            });
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Registration initiated. Please verify your email with the OTP sent.',
            data: {
                userId: user.id,
                email: user.email,
                requiresOTP: true
            }
        });
    } catch (error) {
        next(error);
    }
};

// Verify OTP
const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const result = await query(
            `SELECT id, email, role, first_name, last_name, otp_code, otp_expires_at, otp_purpose,
                    email_verified, registration_status
             FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        // Check if OTP matches
        if (user.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid OTP code' }
            });
        }

        // Check if OTP expired
        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({
                success: false,
                error: { message: 'OTP has expired. Please request a new one.' }
            });
        }

        // Update user - email verified, clear OTP
        await query(
            `UPDATE users SET 
                email_verified = true, 
                otp_code = NULL, 
                otp_expires_at = NULL,
                otp_purpose = NULL
             WHERE id = $1`,
            [user.id]
        );

        res.json({
            success: true,
            message: 'Email verified successfully! Please wait for admin approval.',
            data: {
                emailVerified: true,
                registrationStatus: user.registration_status,
                requiresCNIC: true
            }
        });
    } catch (error) {
        next(error);
    }
};

// Resend OTP
const resendOTP = async (req, res, next) => {
    try {
        const { email, purpose = 'email_verify' } = req.body;

        const result = await query(
            'SELECT id, first_name, email_verified FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        if (purpose === 'email_verify' && user.email_verified) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email already verified' }
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await query(
            `UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_purpose = $3 WHERE id = $4`,
            [otp, otpExpiresAt, purpose, user.id]
        );

        // Send OTP email
        const emailContent = purpose === 'password_reset'
            ? emailTemplates.passwordResetOtp(otp, user.first_name)
            : emailTemplates.otpVerification(otp, user.first_name);

        await sendEmail({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html
        });

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const result = await query(
            'SELECT id, first_name, email FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If this email exists, an OTP will be sent'
            });
        }

        const user = result.rows[0];

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await query(
            `UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_purpose = 'password_reset' WHERE id = $3`,
            [otp, otpExpiresAt, user.id]
        );

        // Send email
        const emailContent = emailTemplates.passwordResetOtp(otp, user.first_name);
        await sendEmail({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html
        });

        res.json({
            success: true,
            message: 'Password reset OTP sent to your email'
        });
    } catch (error) {
        next(error);
    }
};

// Reset Password with OTP
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const result = await query(
            `SELECT id, otp_code, otp_expires_at, otp_purpose FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        // Verify OTP
        if (user.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid OTP' }
            });
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({
                success: false,
                error: { message: 'OTP has expired' }
            });
        }

        if (user.otp_purpose !== 'password_reset') {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid OTP purpose' }
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        await query(
            `UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL WHERE id = $2`,
            [passwordHash, user.id]
        );

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Upload CNIC (for registration)
const uploadCNIC = async (req, res, next) => {
    try {
        const { uploadToCloudinary, useCloudinary } = require('../middleware/upload');

        // multer.fields() gives req.files as an object like { cnicFront: [...], cnicBack: [...] }
        if (!req.files || (!req.files.cnicFront && !req.files.cnicBack)) {
            return res.status(400).json({
                success: false,
                error: { message: 'No files uploaded' }
            });
        }

        const updates = {};

        if (req.files.cnicFront && req.files.cnicFront[0]) {
            if (useCloudinary) {
                updates.cnic_front_image = await uploadToCloudinary(req.files.cnicFront[0].path, 'cnic');
            } else {
                updates.cnic_front_image = `/uploads/cnic/${req.files.cnicFront[0].filename}`;
            }
        }
        if (req.files.cnicBack && req.files.cnicBack[0]) {
            if (useCloudinary) {
                updates.cnic_back_image = await uploadToCloudinary(req.files.cnicBack[0].path, 'cnic');
            } else {
                updates.cnic_back_image = `/uploads/cnic/${req.files.cnicBack[0].filename}`;
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No valid CNIC files found' }
            });
        }

        const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`);
        const values = Object.values(updates);

        await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length + 1}`,
            [...values, req.user.id]
        );

        res.json({
            success: true,
            message: 'CNIC uploaded successfully. Waiting for admin approval.',
            data: updates
        });
    } catch (error) {
        next(error);
    }
};

// Upload CNIC (Public - for registration pending users)
const uploadCNICPublic = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: { message: 'Email is required' }
            });
        }

        // Find user by email
        const userResult = await query(
            'SELECT id, registration_status FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = userResult.rows[0];

        // multer.fields() gives req.files as an object
        if (!req.files || (!req.files.cnicFront && !req.files.cnicBack)) {
            return res.status(400).json({
                success: false,
                error: { message: 'No files uploaded' }
            });
        }

        const updates = {};

        if (req.files.cnicFront && req.files.cnicFront[0]) {
            updates.cnic_front_image = `/uploads/cnic/${req.files.cnicFront[0].filename}`;
        }
        if (req.files.cnicBack && req.files.cnicBack[0]) {
            updates.cnic_back_image = `/uploads/cnic/${req.files.cnicBack[0].filename}`;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No valid CNIC files found' }
            });
        }

        const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`);
        const values = Object.values(updates);

        await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length + 1}`,
            [...values, user.id]
        );

        res.json({
            success: true,
            message: 'CNIC uploaded successfully. Waiting for admin approval.',
            data: updates
        });
    } catch (error) {
        next(error);
    }
};

// Login user
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await query(
            `SELECT id, email, password_hash, role, first_name, last_name, 
                    is_active, is_verified, email_verified, registration_status, profile_image
             FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid email or password' }
            });
        }

        const user = result.rows[0];

        // Check password first
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid email or password' }
            });
        }

        // Check email verification
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Please verify your email first',
                    code: 'EMAIL_NOT_VERIFIED'
                }
            });
        }

        // Check registration status (skip for admin)
        if (user.role !== 'admin' && user.registration_status !== 'approved') {
            let message = 'Your registration is pending approval';
            if (user.registration_status === 'rejected') {
                message = 'Your registration was rejected. Please contact support.';
            }
            return res.status(403).json({
                success: false,
                error: {
                    message,
                    code: 'REGISTRATION_PENDING',
                    status: user.registration_status
                }
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: { message: 'Account is deactivated' }
            });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isVerified: user.is_verified,
                    profileImage: user.profile_image
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get current user profile
const getProfile = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, email, phone, role, first_name, last_name, company_name,
                    address, city, state, country, postal_code, latitude, longitude,
                    cnic_number, cnic_front_image, cnic_back_image, profile_image,
                    is_verified, is_active, email_verified, phone_verified, registration_status,
                    created_at, updated_at
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                companyName: user.company_name,
                address: user.address,
                city: user.city,
                state: user.state,
                country: user.country,
                postalCode: user.postal_code,
                latitude: user.latitude,
                longitude: user.longitude,
                cnicNumber: user.cnic_number,
                cnicFrontImage: user.cnic_front_image,
                cnicBackImage: user.cnic_back_image,
                profileImage: user.profile_image,
                isVerified: user.is_verified,
                isActive: user.is_active,
                emailVerified: user.email_verified,
                phoneVerified: user.phone_verified,
                registrationStatus: user.registration_status,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update user profile
const updateProfile = async (req, res, next) => {
    try {
        const {
            phone,
            firstName,
            lastName,
            companyName,
            address,
            city,
            state,
            country,
            postalCode,
            latitude,
            longitude,
            cnicNumber
        } = req.body;

        const result = await query(
            `UPDATE users SET
                phone = COALESCE($1, phone),
                first_name = COALESCE($2, first_name),
                last_name = COALESCE($3, last_name),
                company_name = COALESCE($4, company_name),
                address = COALESCE($5, address),
                city = COALESCE($6, city),
                state = COALESCE($7, state),
                country = COALESCE($8, country),
                postal_code = COALESCE($9, postal_code),
                latitude = COALESCE($10, latitude),
                longitude = COALESCE($11, longitude),
                cnic_number = COALESCE($12, cnic_number)
             WHERE id = $13
             RETURNING id, email, phone, role, first_name, last_name, company_name,
                       address, city, state, country, postal_code`,
            [
                phone, firstName, lastName, companyName,
                address, city, state, country, postalCode,
                latitude, longitude, cnicNumber, req.user.id
            ]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Upload profile image
const uploadProfileImage = async (req, res, next) => {
    try {
        const { uploadToCloudinary, useCloudinary } = require('../middleware/upload');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' }
            });
        }

        // Upload to Cloudinary if configured
        let imageUrl;
        if (useCloudinary) {
            imageUrl = await uploadToCloudinary(req.file.path, 'profiles');
        } else {
            imageUrl = `/uploads/profiles/${req.file.filename}`;
        }

        await query(
            'UPDATE users SET profile_image = $1 WHERE id = $2',
            [imageUrl, req.user.id]
        );

        res.json({
            success: true,
            data: { profileImage: imageUrl }
        });
    } catch (error) {
        next(error);
    }
};

// Change password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get current password hash
        const result = await query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: { message: 'Current password is incorrect' }
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Request OTP for password change (authenticated users)
const requestPasswordChangeOTP = async (req, res, next) => {
    try {
        // Get user details
        const result = await query(
            'SELECT id, email, first_name FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Save OTP to database
        await query(
            `UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_purpose = 'password_change' WHERE id = $3`,
            [otp, otpExpiresAt, user.id]
        );

        // Send OTP email
        const emailContent = emailTemplates.passwordResetOtp(otp, user.first_name);
        await sendEmail({
            to: user.email,
            subject: 'Password Change OTP - EquipRent',
            html: emailContent.html
        });

        res.json({
            success: true,
            message: 'OTP sent to your registered email'
        });
    } catch (error) {
        next(error);
    }
};

// Change password with OTP (authenticated users)
const changePasswordWithOTP = async (req, res, next) => {
    try {
        const { otp, newPassword } = req.body;

        // Get user with OTP details
        const result = await query(
            `SELECT id, otp_code, otp_expires_at, otp_purpose FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        // Verify OTP
        if (user.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid OTP' }
            });
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({
                success: false,
                error: { message: 'OTP has expired. Please request a new one.' }
            });
        }

        if (user.otp_purpose !== 'password_change') {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid OTP purpose' }
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        await query(
            `UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL WHERE id = $2`,
            [passwordHash, user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    login,
    getProfile,
    updateProfile,
    uploadCNIC,
    uploadCNICPublic,
    uploadProfileImage,
    changePassword,
    requestPasswordChangeOTP,
    changePasswordWithOTP
};
