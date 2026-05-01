const User = require('../models/User');
const Attendance = require('../models/Attendance');
const ApiError = require('../utils/ApiError');
const { generatePassword } = require('../utils/password');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/mailer');

/** GET /api/admin/requests — pending registrations */
async function listRequests(req, res, next) {
  try {
    const { status = 'pending' } = req.query;
    const users = await User.find({ role: 'employee', status }).sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/admin/requests/:id (body: { action: approve|reject, reason? }) */
async function decideRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'admin') throw new ApiError(400, 'Cannot act on admin');
    if (user.status !== 'pending') {
      throw new ApiError(409, `Request already ${user.status}`);
    }

    if (action === 'approve') {
      const tempPassword = generatePassword(12);
      user.password = tempPassword;     // pre-save hook hashes it
      user.status = 'approved';
      user.mustChangePassword = true;
      await user.save();
      try {
        await sendApprovalEmail({
          to: user.email,
          firstName: user.firstName,
          mobile: user.mobile,
          password: tempPassword,
        });
      } catch (mailErr) {
        // eslint-disable-next-line no-console
        console.error('[admin] approval email failed:', mailErr.message);
      }
      return res.json({
        message: 'Employee approved and credentials emailed',
        user: user.toSafeJSON(),
      });
    }

    // reject
    user.status = 'rejected';
    user.rejectionReason = reason || null;
    await user.save();
    try {
      await sendRejectionEmail({
        to: user.email,
        firstName: user.firstName,
        reason,
      });
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('[admin] rejection email failed:', mailErr.message);
    }
    return res.json({ message: 'Request rejected', user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/employees */
async function listEmployees(req, res, next) {
  try {
    const employees = await User.find({ role: 'employee' }).sort({ createdAt: -1 });
    return res.json({ employees });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/stats */
async function stats(req, res, next) {
  try {
    const [totalEmployees, approved, pending, rejected] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', status: 'approved' }),
      User.countDocuments({ role: 'employee', status: 'pending' }),
      User.countDocuments({ role: 'employee', status: 'rejected' }),
    ]);

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const [todayPresent, todayLate] = await Promise.all([
      Attendance.countDocuments({ date: todayStr, status: 'present' }),
      Attendance.countDocuments({ date: todayStr, status: 'late' }),
    ]);

    return res.json({
      employees: { total: totalEmployees, approved, pending, rejected },
      today: { date: todayStr, present: todayPresent, late: todayLate, absent: approved - (todayPresent + todayLate) },
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/attendance?date=YYYY-MM-DD */
async function listAttendance(req, res, next) {
  try {
    const { date, userId, from, to } = req.query;
    const q = {};
    if (date) q.date = date;
    if (userId) q.user = userId;
    if (from || to) {
      q.date = q.date || {};
      if (typeof q.date === 'string') q.date = { $eq: q.date };
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    const records = await Attendance.find(q)
      .populate('user', 'firstName lastName username email mobile')
      .sort({ date: -1, checkInAt: -1 })
      .limit(1000);
    return res.json({ records });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/admin/employees/:id */
async function removeEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'admin') throw new ApiError(400, 'Cannot delete admin');
    await User.deleteOne({ _id: id });
    await Attendance.deleteMany({ user: id });
    return res.json({ message: 'Employee removed' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listRequests,
  decideRequest,
  listEmployees,
  stats,
  listAttendance,
  removeEmployee,
};
