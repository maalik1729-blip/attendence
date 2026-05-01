const Holiday = require('../models/Holiday');
const ApiError = require('../utils/ApiError');

/** GET /api/holidays */
async function list(req, res, next) {
  try {
    const { year } = req.query;
    const q = {};
    if (year) q.date = { $regex: `^${year}` };
    const holidays = await Holiday.find(q).sort({ date: 1 });
    return res.json({ holidays });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/holidays (admin) */
async function create(req, res, next) {
  try {
    const holiday = await Holiday.create({
      ...req.body,
      createdBy: req.user.id,
    });
    return res.status(201).json({ holiday });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/holidays/:id (admin) */
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const h = await Holiday.findByIdAndDelete(id);
    if (!h) throw new ApiError(404, 'Holiday not found');
    return res.json({ message: 'Holiday deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, remove };
