const Registration = require('../models/Registration');
const User = require('../models/User');
const Event = require('../models/Event');

class RegistrationController {
  /**
   * Create a new registration for an event
   * POST /api/registrations
   */
  static async createRegistration(req, res) {
    try {
      // Get user's internal ID from their auth ID
      const userProfile = await User.findByAuthId(req.user.id);
      if (!userProfile) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const registrationData = {
        user_id: userProfile.id,
        event_id: req.body.event_id,
        status: 'confirmed', // Default status
      };

      const newRegistration = await Registration.create(registrationData);

      res.status(201).json({
        success: true,
        message: 'Successfully registered for the event.',
        data: newRegistration,
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all registrations for the currently authenticated user
   * GET /api/registrations/my-registrations
   */
  static async getMyRegistrations(req, res) {
    try {
      const userProfile = await User.findByAuthId(req.user.id);
      if (!userProfile) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      const registrations = await Registration.findByUserId(userProfile.id);
      res.status(200).json({ success: true, data: registrations });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Cancel a registration
   * DELETE /api/registrations/:id
   */
  static async cancelRegistration(req, res) {
    try {
      const registrationId = req.params.id;
      
      const registration = await Registration.findById(registrationId);
      if (!registration) {
        return res.status(404).json({ success: false, error: 'Registration not found.' });
      }

      const userProfile = await User.findByAuthId(req.user.id);
      
      // Authorization: User can only cancel their own registration
      if (registration.user_id !== userProfile.id) {
        return res.status(403).json({ success: false, error: 'You are not authorized to cancel this registration.' });
      }

      await Registration.remove(registrationId);

      res.status(200).json({ success: true, message: 'Registration cancelled successfully.' });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get all registrations for a specific event
   * GET /api/registrations/event/:eventId
   * Requires 'organizer' or 'admin' role
   */
  static async getRegistrationsForEvent(req, res) {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found.' });
        }

        const userProfile = await User.findByAuthId(req.user.id);

        // Authorization: Must be admin or event organizer
        if (userProfile.role !== 'admin' && event.organizer_id !== userProfile.id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to view registrations for this event.' });
        }

        const registrations = await Registration.findByEventId(eventId);
        res.status(200).json({ success: true, data: registrations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
  }

    /**
   * Update a registration's status
   * PUT /api/registrations/:id
   * Requires 'organizer' or 'admin' role
   */
  static async updateRegistrationStatus(req, res) {
    try {
        const registrationId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, error: 'Status is required.' });
        }

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, error: 'Registration not found.' });
        }

        const event = await Event.findById(registration.event_id);
        const userProfile = await User.findByAuthId(req.user.id);

        // Authorization: Must be admin or event organizer
        if (userProfile.role !== 'admin' && event.organizer_id !== userProfile.id) {
            return res.status(403).json({ success: false, error: 'You are not authorized to update this registration.' });
        }

        const updatedRegistration = await Registration.update(registrationId, { status });

        res.status(200).json({ 
            success: true, 
            message: 'Registration status updated successfully.',
            data: updatedRegistration 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = RegistrationController;
