const { query } = require('../config/database');

// Create transportation request
const createTransportRequest = async (req, res, next) => {
    try {
        const {
            bookingId,
            requestType,
            pickupAddress,
            pickupLatitude,
            pickupLongitude,
            deliveryAddress,
            deliveryLatitude,
            deliveryLongitude,
            preferredDate,
            preferredTime,
            vehicleType,
            specialRequirements
        } = req.body;

        // Verify booking exists and user is part of it
        const booking = await query(
            'SELECT * FROM bookings WHERE id = $1 AND (renter_id = $2 OR owner_id = $2)',
            [bookingId, req.user.id]
        );

        if (booking.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        const result = await query(
            `INSERT INTO transportation_requests (
        booking_id, request_type, pickup_address, pickup_latitude, pickup_longitude,
        delivery_address, delivery_latitude, delivery_longitude, preferred_date,
        preferred_time, vehicle_type, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                bookingId, requestType, pickupAddress, pickupLatitude, pickupLongitude,
                deliveryAddress, deliveryLatitude, deliveryLongitude, preferredDate,
                preferredTime, vehicleType, specialRequirements
            ]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Get transportation requests
const getTransportRequests = async (req, res, next) => {
    try {
        const { bookingId } = req.query;

        let whereClause = '';
        const params = [];

        if (bookingId) {
            params.push(bookingId);
            whereClause = `WHERE tr.booking_id = $${params.length}`;
        }

        const result = await query(
            `SELECT tr.*, b.booking_number, e.title as equipment_title
       FROM transportation_requests tr
       JOIN bookings b ON tr.booking_id = b.id
       JOIN equipment e ON b.equipment_id = e.id
       ${whereClause}
       ORDER BY tr.created_at DESC`,
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

// Update transportation request status
const updateTransportStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, driverName, driverPhone, notes } = req.body;

        const result = await query(
            `UPDATE transportation_requests 
       SET status = COALESCE($1, status),
           driver_name = COALESCE($2, driver_name),
           driver_phone = COALESCE($3, driver_phone),
           notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
            [status, driverName, driverPhone, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Request not found' }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Operator management
const createOperator = async (req, res, next) => {
    try {
        const {
            name, phone, email, cnicNumber, licenseNumber,
            experienceYears, specializations, dailyRate, notes
        } = req.body;

        const result = await query(
            `INSERT INTO operators (
        owner_id, name, phone, email, cnic_number, license_number,
        experience_years, specializations, daily_rate, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
            [
                req.user.id, name, phone, email, cnicNumber, licenseNumber,
                experienceYears, specializations, dailyRate, notes
            ]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getOperators = async (req, res, next) => {
    try {
        const { ownerId } = req.query;

        let whereClause = '';
        const params = [];

        if (ownerId) {
            params.push(ownerId);
            whereClause = `WHERE owner_id = $1`;
        } else if (req.user.role === 'owner') {
            params.push(req.user.id);
            whereClause = `WHERE owner_id = $1`;
        }

        const result = await query(
            `SELECT * FROM operators ${whereClause} ORDER BY name`,
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

const updateOperator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'name', 'phone', 'email', 'cnic_number', 'license_number',
            'experience_years', 'specializations', 'daily_rate', 'is_available', 'notes'
        ];

        const setClauses = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (allowedFields.includes(snakeKey)) {
                values.push(value);
                setClauses.push(`${snakeKey} = $${values.length}`);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No valid fields to update' }
            });
        }

        values.push(id, req.user.id);

        const result = await query(
            `UPDATE operators SET ${setClauses.join(', ')}
       WHERE id = $${values.length - 1} AND owner_id = $${values.length}
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Operator not found' }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransportRequest,
    getTransportRequests,
    updateTransportStatus,
    createOperator,
    getOperators,
    updateOperator
};
