const Event = require('../models/Event');
const User = require('../models/User');
const supabase = require('../supabaseClient');

class EventController {
  /**
   * Get all events (publicly accessible)
   * GET /api/events
   */
  static async getAllEvents(req, res) {
    try {
      // For this public endpoint, we'll only show active events.
      const { page = 1, limit = 20, category } = req.query;
      const filters = { is_active: true };
      if (category && category !== 'all') {
        filters.category = category;
      }

      const result = await Event.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        filters,
      });

      res.status(200).json({
        success: true,
        data: result.events,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get a single event by ID (publicly accessible)
   * GET /api/events/:id
   */
  static async getEventById(req, res) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      res.status(200).json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Create a new event
   * POST /api/events
   * Requires 'organizer' or 'admin' role
   */
  static async createEvent(req, res) {
  try {
    // The user object is attached by the auth middleware
    const authId = req.user.id; // This is the UUID from auth
    
    // Query Supabase to get the integer user ID
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();
    
    if (error) {
      throw new Error('User not found');
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Now user is an object like { id: 5 }, so we extract the id
    const organizerId = user.id;
    const eventData = { ...req.body, organizer_id: organizerId };

    const newEvent = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

  /**
   * Update an existing event
   * PUT /api/events/:id
   * Requires user to be the event organizer or an admin
   */
  static async updateEvent(req, res) {
    try {
      const eventId = req.params.id;
      const eventToUpdate = await Event.findById(eventId);

      if (!eventToUpdate) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      // Fetch user profile to check role
      const userProfile = await User.findByAuthId(req.user.id);

      // Check for authorization
      if (eventToUpdate.organizer_id !== userProfile.id && userProfile.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'You are not authorized to update this event.' });
      }

      // Prevent changing the organizer_id
      const { organizer_id, ...updates } = req.body;

      const updatedEvent = await Event.update(eventId, updates);

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete an event
   * DELETE /api/events/:id
   * Requires user to be the event organizer or an admin
   */
  static async deleteEvent(req, res) {
    try {
      const eventId = req.params.id;
      const eventToDelete = await Event.findById(eventId);

      if (!eventToDelete) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      // Fetch user profile to check role
      const userProfile = await User.findByAuthId(req.user.id);

      // Check for authorization
      if (eventToDelete.organizer_id !== userProfile.id && userProfile.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'You are not authorized to delete this event.' });
      }

      await Event.remove(eventId);

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = EventController;
