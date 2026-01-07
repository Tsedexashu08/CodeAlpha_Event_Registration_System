const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const userData = req.body;

      // Create user using the User model
      const newUser = await User.create(userData);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({ 
        success: true,
        message: 'User registered successfully', 
        data: {
          user: newUser,
          token
        }
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
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

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide email and password'
        });
      }

      // Find user by email
      const userRecord = await User.findByEmail(email);
      
      if (!userRecord) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, userRecord.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: userRecord.id, 
          email: userRecord.email, 
          role: userRecord.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = userRecord;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getProfile(req, res) {
    try {
      // req.user should be set by auth middleware
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userProfile = await User.findById(req.user.id);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Don't allow role updates through profile update (unless admin)
      const updates = { ...req.body };
      if (req.user.role !== 'admin' && updates.role) {
        delete updates.role;
      }

      // Prevent updating other users' profiles
      const updatedUser = await User.update(req.user.id, updates);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Please provide current and new password'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters'
        });
      }

      const user = await User.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/admin/users
   */
  static async getAllUsers(req, res) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { page = 1, limit = 20 } = req.query;
      
      const result = await User.findAll(parseInt(page), parseInt(limit));

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/admin/users/:id
   */
  static async getUserById(req, res) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const userProfile = await User.findById(req.params.id);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update user role (admin only)
   * PUT /api/admin/users/:id/role
   */
  static async updateUserRole(req, res) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { role } = req.body;

      if (!role || !['user', 'organizer', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Valid role is required: user, organizer, or admin'
        });
      }

      // Don't allow self-role change to non-admin
      if (req.params.id === req.user.id && role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove admin role from yourself'
        });
      }

      const updatedUser = await User.update(req.params.id, { role });

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: updatedUser
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Logout user (client-side, just returns success)
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    res.status(200).json({
      success: true,
      message: 'Logout successful (token should be removed client-side)'
    });
  }

  /**
   * Verify token validity
   * GET /api/auth/verify
   */
  static async verifyToken(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Get fresh user data
      const userProfile = await User.findById(req.user.id);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: userProfile,
          token: req.header('Authorization')?.replace('Bearer ', '')
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = UserController;