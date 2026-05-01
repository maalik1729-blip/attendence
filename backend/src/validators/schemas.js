const Joi = require('joi');

const mobile = Joi.string().pattern(/^[0-9]{10}$/).messages({
  'string.pattern.base': 'mobile must be 10 digits',
});

const registerSchema = Joi.object({
  firstName: Joi.string().min(1).max(40).required(),
  lastName: Joi.string().min(1).max(40).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  mobile: mobile.required(),
  email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
  mobile: mobile.required(),
  password: Joi.string().min(6).max(128).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(128).required(),
  newPassword: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/)
    .messages({
      'string.pattern.base':
        'newPassword must be at least 8 chars with upper, lower and digit',
    }),
  confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'confirmPassword must match newPassword',
  }),
});

const approveSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  reason: Joi.string().max(500).optional(),
});

const holidaySchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  description: Joi.string().allow('').max(500).optional(),
  type: Joi.string().valid('public', 'optional', 'company').optional(),
});

const attendanceSchema = Joi.object({
  descriptor: Joi.string().optional(), // JSON stringified array when sent via multipart
  lat: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  lng: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  notes: Joi.string().max(500).allow('').optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  approveSchema,
  holidaySchema,
  attendanceSchema,
};
