const supabase = require('../supabaseClient');
const bcrypt = require('bcryptjs');
// const { validateUser } = require('../utils/validators');

class User {

  static async create(userData) {
    // Validate input
    const { error: validationError } = validateUser(userData);
    if (validationError) {
      throw new Error(validationError);
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'user',
        phone: userData.phone || null
      }])
      .select('id, name, email, role, phone, created_at')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by email (for login)
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by ID (without password)
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, phone, created_at')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user profile
   */
  static async update(id, updates) {
 
    const { password, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', id)
      .select('id, name, email, role, phone, created_at')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Change user password
   */
  static async changePassword(id, currentPassword, newPassword) {
    // Get user with password
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Database error: ${fetchError.message}`);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id)
      .select('id, name, email')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
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
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = User;