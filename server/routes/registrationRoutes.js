const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/RegistrationController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// All routes in this file are protected by default
router.use(authMiddleware);

// Create a new registration
router.post('/', RegistrationController.createRegistration);

// Get all registrations for the current user
router.get('/my-registrations', RegistrationController.getMyRegistrations);

// Cancel a registration
router.delete('/:id', RegistrationController.cancelRegistration);

// Get all registrations for a specific event (organizer/admin)
router.get('/event/:eventId', roleMiddleware('organizer', 'admin'), RegistrationController.getRegistrationsForEvent);

// Update a registration's status (organizer/admin)
router.put('/:id', roleMiddleware('organizer', 'admin'), RegistrationController.updateRegistrationStatus);

module.exports = router;
