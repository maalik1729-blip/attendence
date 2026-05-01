const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { changePasswordSchema } = require('../validators/schemas');
const {
  changePassword,
  getProfile,
  updateProfile,
} = require('../controllers/profileController');

router.use(authRequired);

router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/change-password', validate(changePasswordSchema), changePassword);

module.exports = router;
