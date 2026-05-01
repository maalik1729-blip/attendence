const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ApiError = require('../utils/ApiError');
const {
  checkIn,
  today,
  myHistory,
  mySummary,
} = require('../controllers/attendanceController');

router.use(authRequired);

// Block check-in if user still has default password
function mustHaveChangedPassword(req, _res, next) {
  if (req.user.mustChangePassword) {
    return next(new ApiError(403, 'Please change your temporary password before marking attendance'));
  }
  return next();
}

router.post('/check-in', mustHaveChangedPassword, upload.single('photo'), checkIn);
router.get('/today', today);
router.get('/me', myHistory);
router.get('/me/summary', mySummary);

module.exports = router;
