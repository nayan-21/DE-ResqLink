const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function authenticateJwt(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is rescue team
module.exports.requireRescueTeam = async function requireRescueTeam(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'rescue_team') {
      return res.status(403).json({ message: 'Access denied. Rescue team only.' });
    }
    req.user.userType = user.userType;
    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
