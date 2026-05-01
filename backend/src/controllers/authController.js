const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { generatePassword } = require('../utils/password');

/**
 * POST /api/auth/register
 * Employee self-registration — stays in "pending" until admin approves.
 */
async function register(req, res, next) {
  try {
    const { firstName, lastName, username, mobile, email } = req.body;

    const existing = await User.findOne({
      $or: [{ mobile }, { email }, { username }],
    });
    if (existing) {
      const field =
        existing.mobile === mobile
          ? 'mobile'
          : existing.email === email.toLowerCase()
          ? 'email'
          : 'username';
      throw new ApiError(409, `${field} already registered`);
    }

    // Temporary random password — will be reset on admin approval anyway.
    const tempPassword = generatePassword(14);
    const user = await User.create({
      firstName,
      lastName,
      username,
      mobile,
      email,
      password: tempPassword,
      role: 'employee',
      status: 'pending',
      mustChangePassword: true,
    });

    return res.status(201).json({
      message:
        'Registration received. An administrator will review your request. ' +
        'You will receive an email with your credentials once approved.',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const ok = await user.comparePassword(password);
    if (!ok) throw new ApiError(401, 'Invalid credentials');

    if (user.role !== 'admin') {
      if (user.status === 'pending') {
        throw new ApiError(403, 'Your account is awaiting admin approval');
      }
      if (user.status === 'rejected') {
        throw new ApiError(403, 'Your registration request was rejected');
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ sub: user.id, role: user.role });

    return res.json({
      token,
      mustChangePassword: user.mustChangePassword,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

module.exports = { register, login, me };
