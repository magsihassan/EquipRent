const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const checklistController = require('../controllers/checklistController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { upload, setUploadType } = require('../middleware/upload');
const { validate } = require('../middleware/validate');

router.use(authenticate);

// Checklists
router.post('/',
    body('bookingId').isUUID(),
    body('type').isIn(['check_in', 'check_out']),
    validate,
    checklistController.createChecklist
);

router.get('/booking/:bookingId', checklistController.getChecklists);

router.post('/:checklistId/images',
    setUploadType('checklist'),
    upload.array('images', 10),
    checklistController.uploadChecklistImages
);

// Maintenance
router.post('/maintenance',
    authorize('owner', 'admin'),
    body('equipmentId').isUUID(),
    body('maintenanceType').notEmpty(),
    body('description').notEmpty(),
    validate,
    checklistController.createMaintenanceLog
);

router.get('/maintenance/:equipmentId', checklistController.getMaintenanceLogs);

module.exports = router;
