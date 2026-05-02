const router = require('express').Router();
const { authRequired, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { approveSchema } = require('../validators/schemas');
const {
  listRequests,
  decideRequest,
  listEmployees,
  stats,
  listAttendance,
  removeEmployee,
  enrollFace,
} = require('../controllers/adminController');

router.use(authRequired, adminOnly);

router.get('/requests', listRequests);
router.post('/requests/:id', validate(approveSchema), decideRequest);
router.get('/employees', listEmployees);
router.delete('/employees/:id', removeEmployee);
router.post('/employees/:id/face', upload.single('photo'), enrollFace);
router.get('/stats', stats);
router.get('/attendance', listAttendance);

module.exports = router;
