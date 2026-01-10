const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Public routes
router.get('/', EventController.getAllEvents);
router.get('/:id', EventController.getEventById);

// Protected routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware('organizer', 'admin'),
  EventController.createEvent
);

router.put(
  '/:id',
  authMiddleware,
  EventController.updateEvent
);

router.delete(
  '/:id',
  authMiddleware,
  EventController.deleteEvent
);

module.exports = router;
