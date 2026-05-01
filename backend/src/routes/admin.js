const router = require('express').Router();
const { authRequired, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { approveSchema } = require('../validators/schemas');
const {
  listRequests,
  decideRequest,
  listEmployees,
  stats,
  listAttendance,
  removeEmployee,
} = require('../controllers/adminController');

router.use(authRequired, adminOnly);

router.get('/requests', listRequests);
router.post('/requests/:id', validate(approveSchema), decideRequest);
router.get('/employees', listEmployees);
router.delete('/employees/:id', removeEmployee);
router.get('/stats', stats);
router.get('/attendance', listAttendance);

module.exports = router;
