const supabase = require('../supabaseClient');

class Event {
  /**
   * Create a new event
   */
  static async create(eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data ? data[0] : null;
  }

  /**
   * Find all events, with optional filters and pagination
   */
  static async findAll({ page = 1, limit = 20, filters = {} } = {}) {
    let query = supabase
      .from('events')
      .select('*, organizer:users(id, name, email)')
      .order('date', { ascending: true });

    // Apply filters
    if (filters.is_active) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Pagination
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      events: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Find a single event by its ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*, organizer:users(id, name, email)')
      .eq('id', id)
      .single();

    if (error) {
      // 'PGRST116' is the code for no rows found, which is not a server error
      if (error.code === 'PGRST116') return null;
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Update an event
   */
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select('*, organizer:users(id, name, email)');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data ? data[0] : null;
  }

  /**
   * Delete an event
   */
  static async remove(id) {
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }
}

module.exports = Event;