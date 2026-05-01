const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) throw new ApiError(401, 'User no longer exists');
    if (user.role !== 'admin' && user.status !== 'approved') {
      throw new ApiError(403, 'Account is not active');
    }
    req.user = user;
    req.token = decoded;
    return next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

function adminOnly(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin privileges required'));
  }
  return next();
}

module.exports = { authRequired, adminOnly };
