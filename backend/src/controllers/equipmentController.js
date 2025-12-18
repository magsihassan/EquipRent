const { query, transaction } = require('../config/database');

// Create new equipment
const createEquipment = async (req, res, next) => {
    try {
        const {
            categoryId,
            title,
            description,
            brand,
            model,
            modelYear,
            serialNumber,
            capacity,
            specifications,
            hourlyRate,
            dailyRate,
            weeklyRate,
            monthlyRate,
            minimumRentalDuration,
            city,
            address,
            latitude,
            longitude,
            hasOperator,
            operatorRatePerDay,
            hasTransportation,
            transportationDetails,
            autoApproveBookings,
            quantity
        } = req.body;

        const result = await query(
            `INSERT INTO equipment (
        owner_id, category_id, title, description, brand, model, model_year,
        serial_number, capacity, specifications, hourly_rate, daily_rate,
        weekly_rate, monthly_rate, minimum_rental_duration, city, address,
        latitude, longitude, has_operator, operator_rate_per_day,
        has_transportation, transportation_details, auto_approve_bookings, quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
            [
                req.user.id, categoryId, title, description, brand, model, modelYear,
                serialNumber, capacity, JSON.stringify(specifications || {}),
                hourlyRate, dailyRate, weeklyRate, monthlyRate,
                minimumRentalDuration || 'daily', city, address, latitude, longitude,
                hasOperator || false, operatorRatePerDay, hasTransportation || false,
                transportationDetails, autoApproveBookings || false, quantity || 1
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

// Get all equipment with filters
const getEquipment = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            city,
            minPrice,
            maxPrice,
            hasOperator,
            search,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            latitude,
            longitude,
            radius
        } = req.query;

        const offset = (page - 1) * limit;
        const conditions = ['e.is_approved = true', 'e.is_active = true'];
        const params = [];
        let paramCount = 0;

        if (category) {
            paramCount++;
            conditions.push(`e.category_id = $${paramCount}`);
            params.push(category);
        }

        if (city) {
            paramCount++;
            conditions.push(`LOWER(e.city) LIKE LOWER($${paramCount})`);
            params.push(`%${city}%`);
        }

        if (minPrice) {
            paramCount++;
            conditions.push(`e.daily_rate >= $${paramCount}`);
            params.push(minPrice);
        }

        if (maxPrice) {
            paramCount++;
            conditions.push(`e.daily_rate <= $${paramCount}`);
            params.push(maxPrice);
        }

        if (hasOperator === 'true') {
            conditions.push('e.has_operator = true');
        }

        if (search) {
            paramCount++;
            conditions.push(`(
        LOWER(e.title) LIKE LOWER($${paramCount}) OR
        LOWER(e.description) LIKE LOWER($${paramCount}) OR
        LOWER(e.brand) LIKE LOWER($${paramCount}) OR
        LOWER(e.model) LIKE LOWER($${paramCount})
      )`);
            params.push(`%${search}%`);
        }

        // Distance-based search
        let distanceSelect = '';
        let distanceOrder = '';
        if (latitude && longitude && radius) {
            paramCount++;
            const latParam = paramCount;
            paramCount++;
            const lonParam = paramCount;
            paramCount++;
            const radiusParam = paramCount;

            distanceSelect = `, (
        6371 * acos(
          cos(radians($${latParam})) * cos(radians(e.latitude)) *
          cos(radians(e.longitude) - radians($${lonParam})) +
          sin(radians($${latParam})) * sin(radians(e.latitude))
        )
      ) AS distance`;

            conditions.push(`(
        6371 * acos(
          cos(radians($${latParam})) * cos(radians(e.latitude)) *
          cos(radians(e.longitude) - radians($${lonParam})) +
          sin(radians($${latParam})) * sin(radians(e.latitude))
        )
      ) <= $${radiusParam}`);

            params.push(latitude, longitude, radius);

            if (sortBy === 'distance') {
                distanceOrder = 'distance ASC';
            }
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderClause = distanceOrder || `e.${sortBy} ${sortOrder}`;

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM equipment e ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get equipment with images
        paramCount++;
        const limitParam = paramCount;
        paramCount++;
        const offsetParam = paramCount;
        params.push(limit, offset);

        const result = await query(
            `SELECT 
        e.*,
        c.name as category_name,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.company_name as owner_company,
        (SELECT image_url FROM equipment_images WHERE equipment_id = e.id AND is_primary = true LIMIT 1) as primary_image,
        (e.quantity - e.rented_quantity) as available_quantity
        ${distanceSelect}
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.owner_id = u.id
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
            params
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single equipment by ID
const getEquipmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT 
        e.*,
        c.name as category_name,
        c.description as category_description,
        u.id as owner_id,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.company_name as owner_company,
        u.city as owner_city,
        u.profile_image as owner_profile_image,
        u.is_verified as owner_verified
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.owner_id = u.id
      WHERE e.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found' }
            });
        }

        // Get images
        const images = await query(
            'SELECT * FROM equipment_images WHERE equipment_id = $1 ORDER BY is_primary DESC, sort_order ASC',
            [id]
        );

        // Get reviews
        const reviews = await query(
            `SELECT r.*, u.first_name, u.last_name, u.profile_image
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       WHERE r.target_id = $1 AND r.review_type = 'equipment' AND r.is_approved = true AND r.is_hidden = false
       ORDER BY r.created_at DESC
       LIMIT 10`,
            [id]
        );

        // Get availability
        const availability = await query(
            `SELECT date, is_available, notes FROM equipment_availability 
       WHERE equipment_id = $1 AND date >= CURRENT_DATE
       ORDER BY date ASC
       LIMIT 90`,
            [id]
        );

        const equipment = result.rows[0];

        res.json({
            success: true,
            data: {
                ...equipment,
                images: images.rows,
                reviews: reviews.rows,
                availability: availability.rows
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update equipment
const updateEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build update query dynamically
        const allowedFields = [
            'category_id', 'title', 'description', 'brand', 'model', 'model_year',
            'serial_number', 'capacity', 'specifications', 'hourly_rate', 'daily_rate',
            'weekly_rate', 'monthly_rate', 'minimum_rental_duration', 'city', 'address',
            'latitude', 'longitude', 'has_operator', 'operator_rate_per_day',
            'has_transportation', 'transportation_details', 'is_available', 'auto_approve_bookings', 'quantity'
        ];

        const setClauses = [];
        const values = [];
        let paramCount = 0;

        // Map camelCase to snake_case
        const fieldMap = {
            categoryId: 'category_id',
            modelYear: 'model_year',
            serialNumber: 'serial_number',
            hourlyRate: 'hourly_rate',
            dailyRate: 'daily_rate',
            weeklyRate: 'weekly_rate',
            monthlyRate: 'monthly_rate',
            minimumRentalDuration: 'minimum_rental_duration',
            hasOperator: 'has_operator',
            operatorRatePerDay: 'operator_rate_per_day',
            hasTransportation: 'has_transportation',
            transportationDetails: 'transportation_details',
            isAvailable: 'is_available',
            autoApproveBookings: 'auto_approve_bookings',
            quantity: 'quantity'
        };

        for (const [key, value] of Object.entries(updates)) {
            const dbField = fieldMap[key] || key;
            if (allowedFields.includes(dbField) && value !== undefined) {
                paramCount++;
                setClauses.push(`${dbField} = $${paramCount}`);
                values.push(key === 'specifications' ? JSON.stringify(value) : value);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No valid fields to update' }
            });
        }

        paramCount++;
        values.push(id);
        paramCount++;
        values.push(req.user.id);

        const result = await query(
            `UPDATE equipment SET ${setClauses.join(', ')}
       WHERE id = $${paramCount - 1} AND owner_id = $${paramCount}
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found or access denied' }
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

// Delete equipment
const deleteEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Soft delete - just mark as inactive
        const result = await query(
            `UPDATE equipment SET is_active = false
       WHERE id = $1 AND owner_id = $2
       RETURNING id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found or access denied' }
            });
        }

        res.json({
            success: true,
            message: 'Equipment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Upload equipment images
const uploadImages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { uploadToCloudinary, useCloudinary } = require('../middleware/upload');

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'No files uploaded' }
            });
        }

        // Verify ownership
        const equipment = await query(
            'SELECT id FROM equipment WHERE id = $1 AND owner_id = $2',
            [id, req.user.id]
        );

        if (equipment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found or access denied' }
            });
        }

        // Check existing images count
        const existingCount = await query(
            'SELECT COUNT(*) FROM equipment_images WHERE equipment_id = $1',
            [id]
        );
        const currentCount = parseInt(existingCount.rows[0].count);

        // Insert images
        const insertedImages = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const isPrimary = currentCount === 0 && i === 0;

            // Upload to Cloudinary if configured, otherwise use local path
            let imageUrl;
            if (useCloudinary) {
                imageUrl = await uploadToCloudinary(file.path, 'equipment');
            } else {
                imageUrl = `/uploads/equipment/${file.filename}`;
            }

            const result = await query(
                `INSERT INTO equipment_images (equipment_id, image_url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [id, imageUrl, isPrimary, currentCount + i]
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

// Delete equipment image
const deleteImage = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;

        // Verify ownership
        const result = await query(
            `DELETE FROM equipment_images 
       WHERE id = $1 AND equipment_id = $2 
       AND equipment_id IN (SELECT id FROM equipment WHERE owner_id = $3)
       RETURNING *`,
            [imageId, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Image not found or access denied' }
            });
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Set primary image
const setPrimaryImage = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;

        await transaction(async (client) => {
            // Remove primary from all images
            await client.query(
                `UPDATE equipment_images SET is_primary = false 
         WHERE equipment_id = $1`,
                [id]
            );

            // Set new primary
            await client.query(
                `UPDATE equipment_images SET is_primary = true 
         WHERE id = $1 AND equipment_id = $2`,
                [imageId, id]
            );
        });

        res.json({
            success: true,
            message: 'Primary image updated'
        });
    } catch (error) {
        next(error);
    }
};

// Get owner's equipment
const getMyEquipment = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let statusCondition = '';
        const params = [req.user.id];

        if (status === 'active') {
            statusCondition = 'AND e.is_active = true AND e.is_approved = true';
        } else if (status === 'pending') {
            statusCondition = 'AND e.is_approved = false';
        } else if (status === 'inactive') {
            statusCondition = 'AND e.is_active = false';
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM equipment e WHERE e.owner_id = $1 ${statusCondition}`,
            params
        );

        params.push(limit, offset);

        const result = await query(
            `SELECT 
        e.*,
        c.name as category_name,
        (SELECT image_url FROM equipment_images WHERE equipment_id = e.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM bookings WHERE equipment_id = e.id) as booking_count,
        (e.quantity - e.rented_quantity) as available_quantity
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      WHERE e.owner_id = $1 ${statusCondition}
      ORDER BY e.created_at DESC
      LIMIT $2 OFFSET $3`,
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

// Set availability
const setAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { dates } = req.body; // Array of { date, isAvailable, notes }

        // Verify ownership
        const equipment = await query(
            'SELECT id FROM equipment WHERE id = $1 AND owner_id = $2',
            [id, req.user.id]
        );

        if (equipment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Equipment not found or access denied' }
            });
        }

        // Upsert availability records
        for (const { date, isAvailable, notes } of dates) {
            await query(
                `INSERT INTO equipment_availability (equipment_id, date, is_available, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (equipment_id, date) 
         DO UPDATE SET is_available = $3, notes = $4`,
                [id, date, isAvailable, notes]
            );
        }

        res.json({
            success: true,
            message: 'Availability updated'
        });
    } catch (error) {
        next(error);
    }
};

// Get categories
const getCategories = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT c.*, COUNT(e.id) as equipment_count
       FROM equipment_categories c
       LEFT JOIN equipment e ON c.id = e.category_id AND e.is_active = true AND e.is_approved = true
       GROUP BY c.id
       ORDER BY c.name`
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
    createEquipment,
    getEquipment,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    uploadImages,
    deleteImage,
    setPrimaryImage,
    getMyEquipment,
    setAvailability,
    getCategories
};
