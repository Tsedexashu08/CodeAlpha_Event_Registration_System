const supabase = require('../supabaseClient');
const User = require('../models/User'); // Assuming you have a User model to fetch profile

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
    }

    // Attach the Supabase user object to the request
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};
// Middleware to check specific roles
const roleMiddleware = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    try {
      // Fetch the user's profile from your public table to check the role
      const userProfile = await User.findByAuthId(req.user.id);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found.',
        });
      }

      if (!roles.includes(userProfile.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Requires one of: ${roles.join(', ')}`,
        });
      }

      // Optionally, attach the full profile to the request object
      // if you need it in the controller, to avoid another fetch.
      req.userProfile = userProfile;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'An error occurred while verifying user role.',
      });
    }
  };
};


module.exports = { authMiddleware, roleMiddleware };