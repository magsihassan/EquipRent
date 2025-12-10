const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const logisticsController = require('../controllers/logisticsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

router.use(authenticate);

// Transportation
router.post('/transportation', logisticsController.createTransportRequest);
router.get('/transportation', logisticsController.getTransportRequests);
router.patch('/transportation/:id', authorize('owner', 'admin'), logisticsController.updateTransportStatus);

// Operators
router.post('/operators', authorize('owner', 'admin'), logisticsController.createOperator);
router.get('/operators', logisticsController.getOperators);
router.put('/operators/:id', authorize('owner', 'admin'), logisticsController.updateOperator);

module.exports = router;
