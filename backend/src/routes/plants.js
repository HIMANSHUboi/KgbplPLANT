const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getPlants, createPlant, updatePlant } = require('../controllers/plantsController');

router.get('/', authenticate, getPlants);
router.post('/', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), createPlant);
router.patch('/:id', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), updatePlant);

module.exports = router;
