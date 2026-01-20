const supabase = require('../supabaseClient');
const Event = require('./Event');

class Registration {
  /**
   * Register for an event
   */
  static async create(registrationData) {
    const { user_id, event_id, additional_info = {} } = registrationData;

    // Check if event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, max_attendees, current_attendees, is_active')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    if (!event.is_active) {
      throw new Error('Event is not active');
    }

    // Check if event is full
    if (event.current_attendees >= event.max_attendees) {
      throw new Error('Event is full');
    }

    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('event_id', event_id)
      .single();

    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        // Reactivate cancelled registration
        return await this.reactivate(existingRegistration.id, user_id);
      }
      throw new Error('Already registered for this event');
    }

    // Create registration
    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        user_id,
        event_id,
        status: 'confirmed',
        additional_info
      }])
      .select(`
        *,
        event:events(id, title, date, location),
        user:users(id, name, email)
      `)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Update event attendees count
    await supabase.rpc('increment_event_attendees', { event_id });

    return data;
  }

  /**
   * Get user's registrations
   */
  static async findByUser(userId, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(id, title, date, location, category, is_active)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('registration_date', { ascending: false })
      .range(start, start + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      registrations: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Get registration by ID
   */
  static async findById(id, userId = null) {
    let query = supabase
      .from('registrations')
      .select(`
        *,
        event:events(*, organizer:users(id, name, email)),
        user:users(id, name, email, phone)
      `)
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Registration not found');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Cancel registration
   */
  static async cancel(id, userId) {
    // Verify ownership
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, user_id, event_id, status')
      .eq('id', id)
      .single();

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.user_id !== userId) {
      throw new Error('Not authorized to cancel this registration');
    }

    if (registration.status === 'cancelled') {
      throw new Error('Registration is already cancelled');
    }

    // Update status
    const { data, error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Update event attendees count
    await supabase.rpc('decrement_event_attendees', { event_id: data.event_id });

    return data;
  }

  /**
   * Reactivate cancelled registration
   */
  static async reactivate(id, userId) {
    // Verify ownership and status
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, user_id, event_id, status')
      .eq('id', id)
      .single();

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.user_id !== userId) {
      throw new Error('Not authorized to update this registration');
    }

    if (registration.status !== 'cancelled') {
      throw new Error('Registration is not cancelled');
    }

    // Check if event is still available
    const isFull = await Event.isFull(registration.event_id);
    if (isFull) {
      throw new Error('Event is now full');
    }

    // Reactivate
    const { data, error } = await supabase
      .from('registrations')
      .update({ status: 'confirmed' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Update event attendees count
    await supabase.rpc('increment_event_attendees', { event_id: data.event_id });

    return data;
  }

  /**
   * Get registrations for an event (organizer/admin only)
   */
  static async findByEvent(eventId, userId, userRole, page = 1, limit = 20) {
    // Verify authorization
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event) {
      throw new Error('Event not found');
    }

    if (userRole !== 'admin' && event.organizer_id !== userId) {
      throw new Error('Not authorized to view registrations for this event');
    }

    const start = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('registrations')
      .select(`
        *,
        user:users(id, name, email, phone)
      `, { count: 'exact' })
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
      .order('registration_date', { ascending: true })
      .range(start, start + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      registrations: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Update registration status (organizer/admin only)
   */
  static async updateStatus(id, status, userId, userRole, eventId = null) {
    // If eventId not provided, get it from registration
    if (!eventId) {
      const { data: registration } = await supabase
        .from('registrations')
        .select('event_id')
        .eq('id', id)
        .single();

      if (!registration) {
        throw new Error('Registration not found');
      }
      eventId = registration.event_id;
    }

    // Verify authorization
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event) {
      throw new Error('Event not found');
    }

    if (userRole !== 'admin' && event.organizer_id !== userId) {
      throw new Error('Not authorized to update this registration');
    }

    const { data, error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Update attendees count if status changed to/from 'confirmed'
    const oldStatus = data.status;
    if ((oldStatus === 'confirmed' && status !== 'confirmed') || 
        (oldStatus !== 'confirmed' && status === 'confirmed')) {
      // This would need a more sophisticated approach in real implementation
      // For simplicity, we'll update the event count
      const { data: eventData } = await supabase
        .from('events')
        .select('current_attendees')
        .eq('id', eventId)
        .single();

      const newCount = status === 'confirmed' 
        ? eventData.current_attendees + 1 
        : Math.max(eventData.current_attendees - 1, 0);

      await supabase
        .from('events')
        .update({ current_attendees: newCount })
        .eq('id', eventId);
    }

    return data;
  }
}

module.exports = Registration;