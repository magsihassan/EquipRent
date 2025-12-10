const { query } = require('../config/database');

// Create checklist
const createChecklist = async (req, res, next) => {
    try {
        const {
            bookingId,
            type,
            fuelLevel,
            hourMeterReading,
            odometerReading,
            overallCondition,
            exteriorCondition,
            interiorCondition,
            mechanicalCondition,
            damageNotes,
            hasDamage,
            additionalNotes
        } = req.body;

        // Verify booking
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

        // Check if checklist of this type already exists
        const existing = await query(
            'SELECT id FROM booking_checklists WHERE booking_id = $1 AND type = $2',
            [bookingId, type]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: { message: `${type} checklist already exists` }
            });
        }

        const result = await query(
            `INSERT INTO booking_checklists (
        booking_id, type, fuel_level, hour_meter_reading, odometer_reading,
        overall_condition, exterior_condition, interior_condition,
        mechanical_condition, damage_notes, has_damage, additional_notes, completed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
            [
                bookingId, type, fuelLevel, hourMeterReading, odometerReading,
                overallCondition, exteriorCondition, interiorCondition,
                mechanicalCondition, damageNotes, hasDamage || false, additionalNotes, req.user.id
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

// Get checklists for booking
const getChecklists = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const result = await query(
            `SELECT bc.*, 
        u.first_name as completed_by_first_name,
        u.last_name as completed_by_last_name,
        (SELECT json_agg(ci.*) FROM checklist_images ci WHERE ci.checklist_id = bc.id) as images
       FROM booking_checklists bc
       LEFT JOIN users u ON bc.completed_by = u.id
       WHERE bc.booking_id = $1
       ORDER BY bc.created_at`,
            [bookingId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// Upload checklist images
const uploadChecklistImages = async (req, res, next) => {
    try {
        const { checklistId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No files uploaded' }
            });
        }

        const insertedImages = [];
        for (const file of req.files) {
            const result = await query(
                `INSERT INTO checklist_images (checklist_id, image_url, image_type, caption)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [checklistId, `/uploads/checklists/${file.filename}`, req.body.imageType, req.body.caption]
            );
            insertedImages.push(result.rows[0]);
        }

        res.status(201).json({
            success: true,
            data: insertedImages
        });
    } catch (error) {
        next(error);
    }
};

// Create maintenance log
const createMaintenanceLog = async (req, res, next) => {
    try {
        const {
            equipmentId,
            maintenanceType,
            description,
            performedBy,
            performedAt,
            cost,
            nextMaintenanceDate,
            notes
        } = req.body;

        // Verify ownership
        const equipment = await query(
            'SELECT id FROM equipment WHERE id = $1 AND owner_id = $2',
            [equipmentId, req.user.id]
        );

        if (equipment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found' }
            });
        }

        const result = await query(
            `INSERT INTO maintenance_logs (
        equipment_id, maintenance_type, description, performed_by,
        performed_at, cost, next_maintenance_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [
                equipmentId, maintenanceType, description, performedBy,
                performedAt, cost, nextMaintenanceDate, notes
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

// Get maintenance logs
const getMaintenanceLogs = async (req, res, next) => {
    try {
        const { equipmentId } = req.params;

        const result = await query(
            `SELECT * FROM maintenance_logs 
       WHERE equipment_id = $1
       ORDER BY performed_at DESC`,
            [equipmentId]
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
    createChecklist,
    getChecklists,
    uploadChecklistImages,
    createMaintenanceLog,
    getMaintenanceLogs
};
