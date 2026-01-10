const supabase = require('../supabaseClient');

class Registration {
  /**
   * Create a new registration
   */
  static async create(registrationData) {
    // Check if user is already registered for the event
    const existing = await this.findByUserAndEvent(registrationData.user_id, registrationData.event_id);
    if (existing) {
      throw new Error('User is already registered for this event.');
    }

    // Check if event is full
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('current_attendees, max_attendees')
      .eq('id', registrationData.event_id)
      .single();
    
    if(eventError) throw new Error(`Could not fetch event details: ${eventError.message}`);
    if(eventData.current_attendees >= eventData.max_attendees) {
      throw new Error('Event is already full.');
    }

    // Create registration
    const { data, error } = await supabase
      .from('registrations')
      .insert([registrationData])
      .select('*, event:events(*), user:users(id, name, email)');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Increment event's current_attendees count
    const { error: updateError } = await supabase
      .from('events')
      .update({ current_attendees: eventData.current_attendees + 1 })
      .eq('id', registrationData.event_id);

    if (updateError) {
      // Log this error but don't fail the whole operation
      console.error('Failed to increment attendee count:', updateError.message);
    }
    
    return data ? data[0] : null;
  }

  /**
   * Find registrations by user ID
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find registrations by event ID
   */
  static async findByEventId(eventId) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, user:users(id, name, email, phone)')
      .eq('event_id', eventId);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find a single registration by its ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, event:events(*), user:users(id, name, email)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find a registration by user and event
   */
  static async findByUserAndEvent(userId, eventId) {
    const { data, error } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle(); // Returns one or null, no error if not found

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Delete a registration
   */
  static async remove(id) {
    // Get event_id before deleting
    const registration = await this.findById(id);
    if (!registration) {
      throw new Error('Registration not found.');
    }

    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Decrement event's current_attendees count
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('current_attendees')
      .eq('id', registration.event_id)
      .single();

    if(eventError) {
      console.error('Could not fetch event to decrement attendees:', eventError.message);
      return;
    }

    if (eventData.current_attendees > 0) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ current_attendees: eventData.current_attendees - 1 })
        .eq('id', registration.event_id);
      
      if (updateError) {
        console.error('Failed to decrement attendee count:', updateError.message);
      }
    }
  }

  /**
   * Update a registration's status
   */
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('registrations')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data ? data[0] : null;
  }
}

module.exports = Registration;
