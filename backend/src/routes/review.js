const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

const createReviewValidation = [
    body('bookingId').isUUID().withMessage('Valid booking ID required'),
    body('reviewType').isIn(['equipment', 'owner', 'operator']).withMessage('Invalid review type'),
    body('targetId').isUUID().withMessage('Valid target ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')
];

// Public routes
router.get('/', reviewController.getReviews);

// Protected routes
router.post('/', authenticate, createReviewValidation, validate, reviewController.createReview);
router.get('/my', authenticate, reviewController.getMyReviews);

// Admin routes
router.patch('/:id/hide', authenticate, authorize('admin'), reviewController.hideReview);

module.exports = router;
