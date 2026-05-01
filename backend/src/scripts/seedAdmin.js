/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const config = require('../config');

(async () => {
  try {
    await connectDB();
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log(`[seed] Admin already exists: mobile=${existing.mobile} email=${existing.email}`);
      // Ensure the configured mobile/password combination works by resetting it.
      existing.mobile = config.admin.mobile;
      existing.email = config.admin.email;
      existing.password = config.admin.password; // re-hashed by pre-save
      existing.status = 'approved';
      existing.mustChangePassword = false;
      await existing.save();
      console.log('[seed] Admin credentials refreshed.');
    } else {
      const admin = await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        username: 'admin',
        mobile: config.admin.mobile,
        email: config.admin.email,
        password: config.admin.password,
        role: 'admin',
        status: 'approved',
        mustChangePassword: false,
      });
      console.log(`[seed] Admin created: mobile=${admin.mobile} email=${admin.email}`);
    }
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
})();
