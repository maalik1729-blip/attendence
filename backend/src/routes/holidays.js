const router = require('express').Router();
const { authRequired, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { holidaySchema } = require('../validators/schemas');
const { list, create, remove } = require('../controllers/holidayController');

router.get('/', authRequired, list);
router.post('/', authRequired, adminOnly, validate(holidaySchema), create);
router.delete('/:id', authRequired, adminOnly, remove);

module.exports = router;
