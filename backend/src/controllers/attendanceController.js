const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { uploadBuffer, cloudinary } = require('../utils/cloudinary');
const { compareDescriptors, isValidDescriptor } = require('../utils/face');
const config = require('../config');

function todayYMD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * POST /api/attendance/check-in
 * multipart/form-data: file=photo, descriptor=JSON array of 128 numbers (optional but recommended)
 */
async function checkIn(req, res, next) {
  try {
    if (!req.file) throw new ApiError(400, 'Photo is required');

    // Parse optional descriptor
    let descriptor = null;
    if (req.body.descriptor) {
      try {
        descriptor = JSON.parse(req.body.descriptor);
      } catch {
        throw new ApiError(400, 'descriptor must be a JSON array of numbers');
      }
      if (!isValidDescriptor(descriptor)) {
        throw new ApiError(400, 'descriptor is invalid');
      }
    }

    const date = todayYMD();
    const existing = await Attendance.findOne({ user: req.user.id, date });
    if (existing) {
      throw new ApiError(409, 'Attendance already marked for today');
    }

    const user = await User.findById(req.user.id).select('+faceDescriptor');

    // Face match logic
    let faceMatchScore = null;
    if (user.faceDescriptor && descriptor) {
      const { matched, distance } = compareDescriptors(
        user.faceDescriptor,
        descriptor,
        config.faceMatchThreshold
      );
      faceMatchScore = distance;
      if (!matched) {
        throw new ApiError(422, 'Face did not match the enrolled face', 'FACE_MISMATCH', {
          distance,
          threshold: config.faceMatchThreshold,
        });
      }
    }

    // Upload the photo to Cloudinary
    const uploaded = await uploadBuffer(req.file.buffer);

    // Ensure Cloudinary detected at least one face
    if (!uploaded.faces || uploaded.faces.length === 0) {
      await cloudinary.uploader.destroy(uploaded.public_id);
      throw new ApiError(400, 'No face detected in the photo! Please ensure your face is clearly visible and try again.', 'NO_FACE_DETECTED');
    }

    // First-time enrolment: save the descriptor + face image
    if (!user.faceDescriptor && descriptor) {
      user.faceDescriptor = descriptor;
      user.faceImageUrl = uploaded.secure_url;
      await user.save();
    }

    // Late if check-in after 10:00
    const now = new Date();
    const status = now.getHours() >= 10 ? 'late' : 'present';

    const attendance = await Attendance.create({
      user: user.id,
      date,
      imageUrl: uploaded.secure_url,
      faceMatchScore,
      status,
      location: {
        lat: req.body.lat ? Number(req.body.lat) : null,
        lng: req.body.lng ? Number(req.body.lng) : null,
      },
      notes: req.body.notes || '',
    });

    return res.status(201).json({
      message:
        user.faceDescriptor && !descriptor
          ? 'Attendance marked (no descriptor sent — face check skipped)'
          : 'Attendance marked successfully',
      attendance,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/attendance/today
 */
async function today(req, res, next) {
  try {
    const record = await Attendance.findOne({ user: req.user.id, date: todayYMD() });
    return res.json({ attendance: record });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/attendance/me?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
async function myHistory(req, res, next) {
  try {
    const { from, to } = req.query;
    const q = { user: req.user.id };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    const records = await Attendance.find(q).sort({ date: -1 }).limit(500);
    return res.json({ records });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/attendance/me/summary
 * Returns counts useful for home screen widgets.
 */
async function mySummary(req, res, next) {
  try {
    const userId = req.user.id;
    const [total, present, late] = await Promise.all([
      Attendance.countDocuments({ user: userId }),
      Attendance.countDocuments({ user: userId, status: 'present' }),
      Attendance.countDocuments({ user: userId, status: 'late' }),
    ]);
    const thisMonth = new Date();
    const ym = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`;
    const monthCount = await Attendance.countDocuments({
      user: userId,
      date: { $regex: `^${ym}` },
    });
    return res.json({ total, present, late, monthCount });
  } catch (err) {
    return next(err);
  }
}

module.exports = { checkIn, today, myHistory, mySummary };
