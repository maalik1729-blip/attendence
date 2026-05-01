require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  admin: {
    mobile: process.env.ADMIN_MOBILE || '1234567890',
    password: process.env.ADMIN_PASSWORD || '12345678',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'attendance',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Attendance <no-reply@example.com>',
  },
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.55'),
};

module.exports = config;
