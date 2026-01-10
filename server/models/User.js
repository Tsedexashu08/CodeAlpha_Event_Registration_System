const supabase = require('../supabaseClient');

class User {
  static async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          auth_id: userData.id, // Supabase auth user ID
          name: userData.name,
          email: userData.email,
          role: userData.role || 'user',
          phone: userData.phone || null,
        },
      ])
      .select('id, auth_id, name, email, role, phone, created_at');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? data[0] : null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id, name, email, role, phone, created_at')
      .eq('email', email);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? data[0] : null;
  }

  /**
   * Find user by integer ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id, name, email, role, phone, created_at')
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? data[0] : null;
  }

  /**
   * Find user by Supabase Auth ID (UUID)
   */
  static async findByAuthId(authId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id, name, email, role, phone, created_at')
      .eq('auth_id', authId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data ? data[0] : null;
  }

  /**
   * Update user profile by integer ID
   */
  static async update(id, updates) {
    const { password, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', id)
      .select('id, auth_id, name, email, role, phone, created_at');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? data[0] : null;
  }

  /**
   * Update user profile by Supabase Auth ID (UUID)
   */
  static async updateByAuthId(authId, updates) {
    const { password, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('auth_id', authId)
      .select('id, auth_id, name, email, role, phone, created_at');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? data[0] : null;
  }


  /**
   * Get all users (admin only)
   */
  static async findAll(page = 1, limit = 20) {
    const start = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('users')
      .select('id, name, email, role, phone, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      users: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }
}

module.exports = User;