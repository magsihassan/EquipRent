const { query } = require('../config/database');

// Create review
const createReview = async (req, res, next) => {
    try {
        const { bookingId, reviewType, targetId, rating, title, comment } = req.body;

        // Verify booking exists and is completed
        const bookingResult = await query(
            'SELECT * FROM bookings WHERE id = $1 AND renter_id = $2 AND status = $3',
            [bookingId, req.user.id, 'completed']
        );

        if (bookingResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Can only review completed bookings' }
            });
        }

        // Check if review already exists
        const existingReview = await query(
            'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2 AND review_type = $3',
            [bookingId, req.user.id, reviewType]
        );

        if (existingReview.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: { message: 'You have already reviewed this' }
            });
        }

        const result = await query(
            `INSERT INTO reviews (booking_id, reviewer_id, review_type, target_id, rating, title, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [bookingId, req.user.id, reviewType, targetId, rating, title, comment]
        );

        // Update average rating
        if (reviewType === 'equipment') {
            await query(
                `UPDATE equipment SET average_rating = (
          SELECT COALESCE(AVG(rating), 0) FROM reviews 
          WHERE target_id = $1 AND review_type = 'equipment' AND is_approved = true
        ) WHERE id = $1`,
                [targetId]
            );
        } else if (reviewType === 'operator') {
            await query(
                `UPDATE operators SET average_rating = (
          SELECT COALESCE(AVG(rating), 0) FROM reviews 
          WHERE target_id = $1 AND review_type = 'operator' AND is_approved = true
        ) WHERE id = $1`,
                [targetId]
            );
        }

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Get reviews for target
const getReviews = async (req, res, next) => {
    try {
        const { targetId, type, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const conditions = ['r.is_approved = true', 'r.is_hidden = false'];
        const params = [];
        let paramCount = 0;

        if (targetId) {
            paramCount++;
            conditions.push(`r.target_id = $${paramCount}`);
            params.push(targetId);
        }

        if (type) {
            paramCount++;
            conditions.push(`r.review_type = $${paramCount}`);
            params.push(type);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM reviews r ${whereClause}`,
            params
        );

        paramCount++;
        params.push(limit);
        paramCount++;
        params.push(offset);

        const result = await query(
            `SELECT r.*, u.first_name, u.last_name, u.profile_image
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
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

// Get my reviews
const getMyReviews = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT r.*, e.title as equipment_title
       FROM reviews r
       LEFT JOIN equipment e ON r.target_id = e.id AND r.review_type = 'equipment'
       WHERE r.reviewer_id = $1
       ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Hide review
const hideReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const result = await query(
            `UPDATE reviews SET is_hidden = true, hidden_reason = $1, hidden_by = $2
       WHERE id = $3
       RETURNING *`,
            [reason, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Review not found' }
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
    createReview,
    getReviews,
    getMyReviews,
    hideReview
};
