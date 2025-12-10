const { query, transaction } = require('../config/database');
const { sendEmail, emailTemplates } = require('../utils/email');

// Get dashboard stats
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = {};

        // User counts
        const userCounts = await query(
            `SELECT role, COUNT(*) as count FROM users GROUP BY role`
        );
        stats.users = {
            total: userCounts.rows.reduce((sum, r) => sum + parseInt(r.count), 0),
            byRole: userCounts.rows.reduce((acc, r) => ({ ...acc, [r.role]: parseInt(r.count) }), {})
        };

        // Pending registrations
        const pendingRegistrations = await query(
            `SELECT COUNT(*) FROM users WHERE registration_status = 'pending' AND email_verified = true`
        );
        stats.pendingRegistrations = parseInt(pendingRegistrations.rows[0].count);

        // Pending verifications (legacy field)
        const pendingVerifications = await query(
            `SELECT COUNT(*) FROM users WHERE is_verified = false AND role != 'admin'`
        );
        stats.pendingVerifications = parseInt(pendingVerifications.rows[0].count);

        // Equipment counts
        const equipmentCounts = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_approved = true) as approved,
                COUNT(*) FILTER (WHERE is_approved = false) as pending
             FROM equipment WHERE is_active = true`
        );
        stats.equipment = equipmentCounts.rows[0];

        // Booking counts
        const bookingCounts = await query(
            `SELECT status, COUNT(*) as count FROM bookings GROUP BY status`
        );
        stats.bookings = {
            total: bookingCounts.rows.reduce((sum, r) => sum + parseInt(r.count), 0),
            byStatus: bookingCounts.rows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count) }), {})
        };

        // Recent activity
        const recentBookings = await query(
            `SELECT b.*, e.title as equipment_title
             FROM bookings b
             JOIN equipment e ON b.equipment_id = e.id
             ORDER BY b.created_at DESC LIMIT 10`
        );
        stats.recentBookings = recentBookings.rows;

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// Get pending registrations
const getPendingRegistrations = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const countResult = await query(
            `SELECT COUNT(*) FROM users WHERE registration_status = 'pending' AND email_verified = true`
        );

        const result = await query(
            `SELECT id, email, phone, role, first_name, last_name, company_name, city,
                    cnic_front_image, cnic_back_image, cnic_number, 
                    email_verified, registration_status, created_at
             FROM users
             WHERE registration_status = 'pending' AND email_verified = true
             ORDER BY created_at ASC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Approve registration
const approveRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE users SET 
                registration_status = 'approved',
                is_verified = true,
                approved_by = $1,
                approved_at = NOW()
             WHERE id = $2
             RETURNING id, email, first_name, last_name, role, registration_status`,
            [req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        // Log admin action
        await query(
            `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_values)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'approve_registration', 'user', id, JSON.stringify({ status: 'approved' })]
        );

        // Send approval email
        try {
            const emailContent = emailTemplates.registrationApproved(user.first_name, user.role);
            await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html
            });
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        res.json({
            success: true,
            message: 'Registration approved successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Reject registration
const rejectRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const result = await query(
            `UPDATE users SET 
                registration_status = 'rejected',
                rejection_reason = $1,
                approved_by = $2,
                approved_at = NOW()
             WHERE id = $3
             RETURNING id, email, first_name, last_name, role, registration_status`,
            [reason, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        const user = result.rows[0];

        // Log admin action
        await query(
            `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_values)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'reject_registration', 'user', id, JSON.stringify({ status: 'rejected', reason })]
        );

        // Send rejection email
        try {
            const emailContent = emailTemplates.registrationRejected(user.first_name, reason);
            await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html
            });
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        res.json({
            success: true,
            message: 'Registration rejected',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Get all users (with filters)
const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, verified, status, search } = req.query;
        const offset = (page - 1) * limit;

        const conditions = [];
        const params = [];
        let paramCount = 0;

        if (role) {
            paramCount++;
            conditions.push(`role = $${paramCount}`);
            params.push(role);
        }

        if (verified !== undefined) {
            paramCount++;
            conditions.push(`is_verified = $${paramCount}`);
            params.push(verified === 'true');
        }

        if (status) {
            paramCount++;
            conditions.push(`registration_status = $${paramCount}`);
            params.push(status);
        }

        if (search) {
            paramCount++;
            conditions.push(`(
                LOWER(first_name) LIKE LOWER($${paramCount}) OR
                LOWER(last_name) LIKE LOWER($${paramCount}) OR
                LOWER(email) LIKE LOWER($${paramCount})
            )`);
            params.push(`%${search}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            params
        );

        paramCount++;
        params.push(limit);
        paramCount++;
        params.push(offset);

        const result = await query(
            `SELECT id, email, phone, role, first_name, last_name, company_name, city,
                    is_verified, is_active, email_verified, registration_status, 
                    cnic_front_image, cnic_back_image, created_at
             FROM users
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
            params
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Verify user (legacy)
const verifyUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isVerified, verified, notes } = req.body;

        // Support both isVerified (frontend) and verified (legacy)
        const verifyStatus = isVerified !== undefined ? isVerified : verified;

        // Set registration_status based on verification status
        const registrationStatus = verifyStatus ? 'approved' : 'pending';

        const result = await query(
            `UPDATE users SET 
                is_verified = $1, 
                registration_status = $2,
                verification_notes = $3,
                approved_by = $4,
                approved_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END
             WHERE id = $5
             RETURNING id, email, first_name, last_name, is_verified, registration_status`,
            [verifyStatus, registrationStatus, notes || null, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }

        // Log admin action
        await query(
            `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_values)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'verify_user', 'user', id, JSON.stringify({ verified: verifyStatus, registrationStatus, notes })]
        );

        res.json({
            success: true,
            message: verifyStatus ? 'User verified and approved' : 'User unverified',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Get equipment for approval
const getPendingEquipment = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT 
                e.*,
                u.first_name as owner_first_name,
                u.last_name as owner_last_name,
                u.email as owner_email,
                c.name as category_name,
                (SELECT image_url FROM equipment_images WHERE equipment_id = e.id AND is_primary = true LIMIT 1) as primary_image
             FROM equipment e
             JOIN users u ON e.owner_id = u.id
             LEFT JOIN equipment_categories c ON e.category_id = c.id
             WHERE e.is_approved = false AND e.is_active = true
             ORDER BY e.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// Approve/reject equipment
const approveEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { approved, notes } = req.body;

        const result = await query(
            `UPDATE equipment SET is_approved = $1, approval_notes = $2
             WHERE id = $3
             RETURNING *`,
            [approved, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found' }
            });
        }

        // Log admin action
        await query(
            `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_values)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, approved ? 'approve_equipment' : 'reject_equipment', 'equipment', id, JSON.stringify({ approved, notes })]
        );

        // Notify owner
        const equipment = result.rows[0];
        await query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                equipment.owner_id,
                approved ? 'equipment_approved' : 'equipment_rejected',
                approved ? 'Equipment Approved' : 'Equipment Rejected',
                approved ? `Your equipment "${equipment.title}" has been approved` : `Your equipment "${equipment.title}" was not approved${notes ? ': ' + notes : ''}`,
                JSON.stringify({ equipmentId: id })
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

// Get all bookings (admin view)
const getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [limit, offset];

        if (status) {
            whereClause = 'WHERE b.status = $3';
            params.push(status);
        }

        const result = await query(
            `SELECT 
                b.*,
                e.title as equipment_title,
                r.first_name as renter_first_name,
                r.last_name as renter_last_name,
                o.first_name as owner_first_name,
                o.last_name as owner_last_name
             FROM bookings b
             JOIN equipment e ON b.equipment_id = e.id
             JOIN users r ON b.renter_id = r.id
             JOIN users o ON b.owner_id = o.id
             ${whereClause}
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`,
            params
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// Manage categories
const createCategory = async (req, res, next) => {
    try {
        const { name, description, icon } = req.body;

        const result = await query(
            `INSERT INTO equipment_categories (name, description, icon)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, description, icon]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, icon } = req.body;

        const result = await query(
            `UPDATE equipment_categories 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description),
                 icon = COALESCE($3, icon)
             WHERE id = $4
             RETURNING *`,
            [name, description, icon, id]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Get admin logs
const getAdminLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT al.*, u.first_name, u.last_name, u.email
             FROM admin_logs al
             JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    getUsers,
    verifyUser,
    getPendingEquipment,
    approveEquipment,
    getAllBookings,
    createCategory,
    updateCategory,
    getAdminLogs
};
