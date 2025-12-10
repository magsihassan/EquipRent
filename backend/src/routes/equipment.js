const express = require('express');
const router = express.Router();
const { body, query: queryValidator } = require('express-validator');
const equipmentController = require('../controllers/equipmentController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { upload, setUploadType } = require('../middleware/upload');
const { validate } = require('../middleware/validate');

// Validation rules
const createEquipmentValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('dailyRate').isFloat({ min: 0 }).withMessage('Valid daily rate is required'),
    body('city').trim().notEmpty().withMessage('City is required')
];

// Public routes
router.get('/', optionalAuth, equipmentController.getEquipment);
router.get('/categories', equipmentController.getCategories);
router.get('/:id', optionalAuth, equipmentController.getEquipmentById);

// Protected routes (Owner only)
router.post(
    '/',
    authenticate,
    authorize('owner', 'admin'),
    createEquipmentValidation,
    validate,
    equipmentController.createEquipment
);

router.get(
    '/my/list',
    authenticate,
    authorize('owner', 'admin'),
    equipmentController.getMyEquipment
);

router.put(
    '/:id',
    authenticate,
    authorize('owner', 'admin'),
    equipmentController.updateEquipment
);

router.delete(
    '/:id',
    authenticate,
    authorize('owner', 'admin'),
    equipmentController.deleteEquipment
);

// Image management
router.post(
    '/:id/images',
    authenticate,
    authorize('owner', 'admin'),
    setUploadType('equipment'),
    upload.array('images', 10),
    equipmentController.uploadImages
);

router.delete(
    '/:id/images/:imageId',
    authenticate,
    authorize('owner', 'admin'),
    equipmentController.deleteImage
);

router.put(
    '/:id/images/:imageId/primary',
    authenticate,
    authorize('owner', 'admin'),
    equipmentController.setPrimaryImage
);

// Availability management
router.post(
    '/:id/availability',
    authenticate,
    authorize('owner', 'admin'),
    equipmentController.setAvailability
);

module.exports = router;
