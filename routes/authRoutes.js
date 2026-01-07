const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController.js');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.js');

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.get('/verify', authMiddleware, UserController.verifyToken);

// Protected routes
router.get('/me', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);
router.put('/change-password', authMiddleware, UserController.changePassword);

// Admin routes
router.get('/admin/users', authMiddleware, roleMiddleware('admin'), UserController.getAllUsers);
router.get('/admin/users/:id', authMiddleware, roleMiddleware('admin'), UserController.getUserById);
router.put('/admin/users/:id/role', authMiddleware, roleMiddleware('admin'), UserController.updateUserRole);

module.exports = router;