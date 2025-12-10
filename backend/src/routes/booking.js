const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Validation rules
const createBookingValidation = [
    body('equipmentId').isUUID().withMessage('Valid equipment ID is required'),
    body('startDate').isDate().withMessage('Valid start date is required'),
    body('endDate').isDate().withMessage('Valid end date is required'),
    body('durationType').optional().isIn(['hourly', 'daily', 'weekly', 'monthly'])
];

const updateStatusValidation = [
    body('status').isIn(['approved', 'rejected', 'active', 'completed', 'cancelled'])
        .withMessage('Invalid status')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', createBookingValidation, validate, bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/status', updateStatusValidation, validate, bookingController.updateBookingStatus);

module.exports = router;
