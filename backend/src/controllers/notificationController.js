const { query } = require('../config/database');

// Get notifications
const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE user_id = $1';
        if (unreadOnly === 'true') {
            whereClause += ' AND is_read = false';
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM notifications ${whereClause}`,
            [req.user.id]
        );

        const result = await query(
            `SELECT * FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        // Get unread count
        const unreadCount = await query(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: result.rows,
            unreadCount: parseInt(unreadCount.rows[0].count),
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

// Mark as read
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        await query(
            `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
};

// Mark all as read
const markAllAsRead = async (req, res, next) => {
    try {
        await query(
            `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;

        await query(
            `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
