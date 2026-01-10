const User = require('../models/User');
const supabase = require('../supabaseClient');

class UserController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { email, password, name, phone } = req.body;

      // Step 1: Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          error: authError.message,
        });
      }

      if (!authData.user) {
        return res.status(400).json({
          success: false,
          error: 'Registration failed, please try again.',
        });
      }

      // Step 2: Create a corresponding user profile in our public `users` table
      const profileData = {
        id: authData.user.id,
        email,
        name,
        phone,
        role: 'user', // Default role
      };

      const newUserProfile = await User.create(profileData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: newUserProfile,
          session: authData.session,
        },
      });
    } catch (error) {
      // If profile creation fails, we should ideally handle the cleanup
      // of the auth user in Supabase, but for now, we'll just report the error.
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide email and password',
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const userProfile = await User.findByAuthId(data.user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userProfile,
          session: data.session,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getProfile(req, res) {
    try {
      // req.user is now the Supabase user object from the auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userProfile = await User.findByAuthId(req.user.id);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: userProfile,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Don't allow role updates through this endpoint
      const { role, ...updates } = req.body;

      const updatedUser = await User.updateByAuthId(req.user.id, updates);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/admin/users
   */
  static async getAllUsers(req, res) {
    try {
      const userProfile = await User.findByAuthId(req.user.id);
      if (!userProfile || userProfile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { page = 1, limit = 20 } = req.query;

      const result = await User.findAll(parseInt(page), parseInt(limit));

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/admin/users/:id
   */
  static async getUserById(req, res) {
    try {
      const userProfile = await User.findByAuthId(req.user.id);
      if (!userProfile || userProfile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const userToFind = await User.findById(req.params.id);

      if (!userToFind) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: userToFind,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Update user role (admin only)
   * PUT /api/admin/users/:id/role
   */
  static async updateUserRole(req, res) {
    try {
      const adminProfile = await User.findByAuthId(req.user.id);
      if (!adminProfile || adminProfile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { role } = req.body;

      if (!role || !['user', 'organizer', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Valid role is required: user, organizer, or admin',
        });
      }

      // Don't allow self-role change to non-admin
      if (req.params.id === req.user.id && role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove admin role from yourself',
        });
      }

      const updatedUser = await User.update(req.params.id, { role });

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: updatedUser,
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }

  /**
   * Verify token validity
   * GET /api/auth/verify
   */
  static async verifyToken(req, res) {
    try {
      // The user object is attached by the auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }

      // Get fresh user data from the public profile table
      const userProfile = await User.findByAuthId(req.user.id);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: userProfile,
          // The token is now managed client-side, but we can pass it back if needed
          token: req.headers.authorization?.split(' ')[1],
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = UserController;