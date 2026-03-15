const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getSKUs, createSKU, updateSKU } = require('../controllers/skusController');

router.get('/',      authenticate, getSKUs);
router.post('/',     authenticate, requireRole('ADMIN','GLOBAL_ADMIN'), createSKU);
router.patch('/:id', authenticate, requireRole('ADMIN','GLOBAL_ADMIN'), updateSKU);

module.exports = router;