const supabase = require('../supabaseClient');
const { validateEvent } = require('../utils/validators');

class Event {
  /**
   * Create a new event
   */
  static async create(eventData) {
    // Validate input
    const { error: validationError } = validateEvent(eventData);
    if (validationError) {
      throw new Error(validationError);
    }

    // Check if organizer exists
    const { data: organizer } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', eventData.organizer_id)
      .single();

    if (!organizer) {
      throw new Error('Organizer not found');
    }

    if (!['organizer', 'admin'].includes(organizer.role)) {
      throw new Error('User is not authorized to create events');
    }

    // Insert event
    const { data, error } = await supabase
      .from('events')
      .insert([{
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time || null,
        location: eventData.location,
        organizer_id: eventData.organizer_id,
        max_attendees: eventData.max_attendees || 100,
        category: eventData.category || 'General',
        price: eventData.price || 0,
        is_active: true
      }])
      .select(`
        *,
        organizer:users(id, name, email)
      `)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all events (with pagination and filters)
   */
  static async findAll(filters = {}, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    let query = supabase
      .from('events')
      .select(`
        *,
        organizer:users(id, name, email),
        registrations(count)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.organizer_id) {
      query = query.eq('organizer_id', filters.organizer_id);
    }

    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('date', { ascending: true })
      .range(start, start + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Calculate available slots
    const eventsWithSlots = data.map(event => ({
      ...event,
      available_slots: event.max_attendees - event.current_attendees,
      is_full: event.current_attendees >= event.max_attendees
    }));

    return {
      events: eventsWithSlots,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Get single event by ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:users(id, name, email, phone)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Event not found');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    // Add calculated fields
    return {
      ...data,
      available_slots: data.max_attendees - data.current_attendees,
      is_full: data.current_attendees >= data.max_attendees
    };
  }

  /**
   * Update event
   */
  static async update(id, updates, userId, userRole) {
    // Verify ownership (organizer can only update their own events)
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', id)
      .single();

    if (!event) {
      throw new Error('Event not found');
    }

    if (userRole !== 'admin' && event.organizer_id !== userId) {
      throw new Error('Not authorized to update this event');
    }

    // Remove fields that shouldn't be updated
    const { organizer_id, current_attendees, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('events')
      .update(safeUpdates)
      .eq('id', id)
      .select(`
        *,
        organizer:users(id, name, email)
      `)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete/Deactivate event
   */
  static async delete(id, userId, userRole) {
    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', id)
      .single();

    if (!event) {
      throw new Error('Event not found');
    }

    if (userRole !== 'admin' && event.organizer_id !== userId) {
      throw new Error('Not authorized to delete this event');
    }

    // Soft delete (deactivate)
    const { data, error } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, title')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Get events by organizer
   */
  static async findByOrganizer(organizerId, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('organizer_id', organizerId)
      .order('date', { ascending: true })
      .range(start, start + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      events: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Check if event is full
   */
  static async isFull(eventId) {
    const { data, error } = await supabase
      .from('events')
      .select('max_attendees, current_attendees')
      .eq('id', eventId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data.current_attendees >= data.max_attendees;
  }
}

module.exports = Event;