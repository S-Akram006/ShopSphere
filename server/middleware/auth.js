const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'shopsphere_access_secret_super_secure_key_2026_xyz'
      );

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found or deleted' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'User account has been deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware] Token error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no bearer token provided' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role [${req.user.role}] is not permitted to access this resource. Allowed roles: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { protect, authorizeRoles };
