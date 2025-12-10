const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Registration Management
router.get('/registrations/pending', adminController.getPendingRegistrations);
router.post('/registrations/:id/approve', adminController.approveRegistration);
router.post('/registrations/:id/reject', adminController.rejectRegistration);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/verify', adminController.verifyUser);

// Equipment Management
router.get('/equipment/pending', adminController.getPendingEquipment);
router.patch('/equipment/:id/approve', adminController.approveEquipment);

// Bookings
router.get('/bookings', adminController.getAllBookings);

// Categories
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);

// Logs
router.get('/logs', adminController.getAdminLogs);

module.exports = router;
