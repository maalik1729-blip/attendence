const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkInAt: { type: Date, default: Date.now },
    checkOutAt: { type: Date, default: null },
    imageUrl: { type: String, required: true },
    faceMatchScore: { type: Number, default: null },
    status: {
      type: String,
      enum: ['present', 'late', 'halfday'],
      default: 'present',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
