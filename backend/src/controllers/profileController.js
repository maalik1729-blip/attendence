const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw new ApiError(400, 'Current password is incorrect');

    if (currentPassword === newPassword) {
      throw new ApiError(400, 'New password must differ from current password');
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

async function updateProfile(req, res, next) {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user.id);
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    await user.save();
    return res.json({ user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = { changePassword, getProfile, updateProfile };
