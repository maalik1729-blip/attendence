const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    description: { type: String, default: '' },
    type: { type: String, enum: ['public', 'optional', 'company'], default: 'public' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
