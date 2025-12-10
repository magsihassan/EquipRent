const { query, transaction } = require('../config/database');
const { sendEmail, emailTemplates } = require('../utils/email');

// Create booking
const createBooking = async (req, res, next) => {
    try {
        const {
            equipmentId,
            startDate,
            endDate,
            startTime,
            endTime,
            durationType,
            includeOperator,
            operatorId,
            includeTransportation,
            deliveryAddress,
            deliveryLatitude,
            deliveryLongitude,
            projectSiteName,
            renterNotes
        } = req.body;

        // Get equipment and owner info
        const equipmentResult = await query(
            `SELECT e.*, u.email as owner_email, u.first_name as owner_first_name
       FROM equipment e
       JOIN users u ON e.owner_id = u.id
       WHERE e.id = $1 AND e.is_approved = true AND e.is_active = true`,
            [equipmentId]
        );

        if (equipmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found or not approved' }
            });
        }

        const equipment = equipmentResult.rows[0];

        // Check if there's available quantity
        if (equipment.rented_quantity >= equipment.quantity) {
            return res.status(409).json({
                success: false,
                error: { message: 'Equipment is not available - all units are currently rented' }
            });
        }

        // Check if renter is not the owner
        if (equipment.owner_id === req.user.id) {
            return res.status(400).json({
                success: false,
                error: { message: 'You cannot book your own equipment' }
            });
        }

        // Check availability for dates
        const conflictCheck = await query(
            `SELECT id FROM bookings 
       WHERE equipment_id = $1 
       AND status IN ('pending', 'approved', 'active')
       AND (
         (start_date <= $2 AND end_date >= $2) OR
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
            [equipmentId, startDate, endDate]
        );

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: { message: 'Equipment is not available for selected dates' }
            });
        }

        // Calculate total days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Determine initial status (auto-approve if enabled)
        const initialStatus = equipment.auto_approve_bookings ? 'approved' : 'pending';

        const result = await query(
            `INSERT INTO bookings (
        equipment_id, renter_id, owner_id, operator_id, start_date, end_date,
        start_time, end_time, duration_type, total_days, include_operator,
        include_transportation, delivery_address, delivery_latitude,
        delivery_longitude, project_site_name, status, renter_notes,
        approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
            [
                equipmentId, req.user.id, equipment.owner_id, operatorId,
                startDate, endDate, startTime, endTime, durationType || 'daily',
                totalDays, includeOperator || false, includeTransportation || false,
                deliveryAddress, deliveryLatitude, deliveryLongitude,
                projectSiteName, initialStatus, renterNotes,
                initialStatus === 'approved' ? new Date() : null
            ]
        );

        const booking = result.rows[0];

        // Get renter info for email
        const renterResult = await query(
            'SELECT first_name, last_name, email FROM users WHERE id = $1',
            [req.user.id]
        );
        const renter = renterResult.rows[0];

        // Send notification email to owner
        try {
            const emailData = emailTemplates.bookingRequest(booking, equipment, renter);
            await sendEmail({
                to: equipment.owner_email,
                ...emailData
            });
        } catch (emailError) {
            console.error('Failed to send booking notification:', emailError);
        }

        // Create in-app notification
        await query(
            `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
            [
                equipment.owner_id,
                'booking_request',
                'New Booking Request',
                `${renter.first_name} ${renter.last_name} has requested to book ${equipment.title}`,
                JSON.stringify({ bookingId: booking.id, equipmentId: equipment.id })
            ]
        );

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${equipment.owner_id}`).emit('notification', {
                type: 'booking_request',
                bookingId: booking.id
            });
        }

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

// Get bookings (with role-based filtering)
const getBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, role } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [];
        let paramCount = 0;

        // Filter by role
        if (req.user.role === 'renter' || role === 'renter') {
            paramCount++;
            whereClause = `WHERE b.renter_id = $${paramCount}`;
            params.push(req.user.id);
        } else if (req.user.role === 'owner' || role === 'owner') {
            paramCount++;
            whereClause = `WHERE b.owner_id = $${paramCount}`;
            params.push(req.user.id);
        } else if (req.user.role === 'admin') {
            // Admin sees all
        }

        // Filter by status
        if (status) {
            paramCount++;
            whereClause += whereClause ? ` AND b.status = $${paramCount}` : `WHERE b.status = $${paramCount}`;
            params.push(status);
        }

        // Count query
        const countResult = await query(
            `SELECT COUNT(*) FROM bookings b ${whereClause}`,
            params
        );

        // Get bookings with related data
        paramCount++;
        const limitParam = paramCount;
        paramCount++;
        const offsetParam = paramCount;
        params.push(limit, offset);

        const result = await query(
            `SELECT 
        b.*,
        e.title as equipment_title,
        e.city as equipment_city,
        (SELECT image_url FROM equipment_images WHERE equipment_id = e.id AND is_primary = true LIMIT 1) as equipment_image,
        r.first_name as renter_first_name,
        r.last_name as renter_last_name,
        r.email as renter_email,
        r.phone as renter_phone,
        o.first_name as owner_first_name,
        o.last_name as owner_last_name,
        o.company_name as owner_company
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users r ON b.renter_id = r.id
      JOIN users o ON b.owner_id = o.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
            params
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single booking
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT 
        b.*,
        e.title as equipment_title,
        e.description as equipment_description,
        e.city as equipment_city,
        e.address as equipment_address,
        e.daily_rate as equipment_daily_rate,
        r.first_name as renter_first_name,
        r.last_name as renter_last_name,
        r.email as renter_email,
        r.phone as renter_phone,
        o.first_name as owner_first_name,
        o.last_name as owner_last_name,
        o.email as owner_email,
        o.phone as owner_phone,
        o.company_name as owner_company,
        op.name as operator_name,
        op.phone as operator_phone
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users r ON b.renter_id = r.id
      JOIN users o ON b.owner_id = o.id
      LEFT JOIN operators op ON b.operator_id = op.id
      WHERE b.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        const booking = result.rows[0];

        // Check access
        if (req.user.role !== 'admin' &&
            booking.renter_id !== req.user.id &&
            booking.owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied' }
            });
        }

        // Get equipment images
        const images = await query(
            'SELECT * FROM equipment_images WHERE equipment_id = $1 ORDER BY is_primary DESC, sort_order ASC',
            [booking.equipment_id]
        );

        // Get checklists
        const checklists = await query(
            `SELECT bc.*, 
        (SELECT json_agg(ci.*) FROM checklist_images ci WHERE ci.checklist_id = bc.id) as images
       FROM booking_checklists bc WHERE bc.booking_id = $1`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...booking,
                equipmentImages: images.rows,
                checklists: checklists.rows
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update booking status
const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes, reason } = req.body;

        // Get current booking
        const bookingResult = await query(
            `SELECT b.*, e.title as equipment_title, 
              r.email as renter_email, r.first_name as renter_first_name
       FROM bookings b
       JOIN equipment e ON b.equipment_id = e.id
       JOIN users r ON b.renter_id = r.id
       WHERE b.id = $1`,
            [id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        const booking = bookingResult.rows[0];

        // Check permission
        const isOwner = booking.owner_id === req.user.id;
        const isRenter = booking.renter_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Status transition validation
        const allowedTransitions = {
            pending: {
                approved: ['owner', 'admin'],
                rejected: ['owner', 'admin'],
                cancelled: ['renter', 'owner', 'admin']
            },
            approved: {
                active: ['owner', 'admin'],
                cancelled: ['renter', 'owner', 'admin']
            },
            active: {
                completed: ['owner', 'admin']
            }
        };

        const currentStatus = booking.status;
        const transitions = allowedTransitions[currentStatus];

        if (!transitions || !transitions[status]) {
            return res.status(400).json({
                success: false,
                error: { message: `Cannot transition from ${currentStatus} to ${status}` }
            });
        }

        const allowedRoles = transitions[status];
        const userRole = isAdmin ? 'admin' : (isOwner ? 'owner' : (isRenter ? 'renter' : null));

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: { message: 'You are not authorized to make this status change' }
            });
        }

        // Update booking
        const updateFields = ['status = $1'];
        const updateParams = [status];
        let paramCount = 1;

        if (status === 'approved') {
            paramCount++;
            updateFields.push(`approved_at = $${paramCount}`);
            updateParams.push(new Date());
        } else if (status === 'rejected') {
            paramCount++;
            updateFields.push(`rejection_reason = $${paramCount}`);
            updateParams.push(reason);
        } else if (status === 'active') {
            paramCount++;
            updateFields.push(`started_at = $${paramCount}`);
            updateParams.push(new Date());
        } else if (status === 'completed') {
            paramCount++;
            updateFields.push(`completed_at = $${paramCount}`);
            updateParams.push(new Date());
        } else if (status === 'cancelled') {
            paramCount++;
            updateFields.push(`cancelled_at = $${paramCount}`);
            updateParams.push(new Date());
            paramCount++;
            updateFields.push(`cancellation_reason = $${paramCount}`);
            updateParams.push(reason);
            paramCount++;
            updateFields.push(`cancelled_by = $${paramCount}`);
            updateParams.push(req.user.id);
        }

        if (notes) {
            paramCount++;
            updateFields.push(`owner_notes = $${paramCount}`);
            updateParams.push(notes);
        }

        paramCount++;
        updateParams.push(id);

        const result = await query(
            `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            updateParams
        );

        // Update equipment rented_quantity and is_available based on booking status
        if (status === 'active') {
            // Increment rented_quantity when rental starts
            await query(
                `UPDATE equipment 
                 SET rented_quantity = rented_quantity + 1,
                     is_available = ((quantity - rented_quantity - 1) > 0)
                 WHERE id = $1`,
                [booking.equipment_id]
            );
        } else if (status === 'completed' || status === 'cancelled') {
            // Decrement rented_quantity when rental ends or is cancelled
            // Only decrement if the booking was previously active
            if (currentStatus === 'active') {
                await query(
                    `UPDATE equipment 
                     SET rented_quantity = GREATEST(0, rented_quantity - 1),
                         is_available = ((quantity - rented_quantity + 1) > 0)
                     WHERE id = $1`,
                    [booking.equipment_id]
                );
            }
        }

        // Send email notifications
        try {
            if (status === 'approved') {
                const emailData = emailTemplates.bookingApproved(booking, { title: booking.equipment_title });
                await sendEmail({ to: booking.renter_email, ...emailData });
            } else if (status === 'rejected') {
                const emailData = emailTemplates.bookingRejected(booking, { title: booking.equipment_title }, reason);
                await sendEmail({ to: booking.renter_email, ...emailData });
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        // Create notification
        const notifyUserId = isOwner ? booking.renter_id : booking.owner_id;
        await query(
            `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
            [
                notifyUserId,
                `booking_${status}`,
                `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                `Your booking for ${booking.equipment_title} has been ${status}`,
                JSON.stringify({ bookingId: booking.id })
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

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus
};
