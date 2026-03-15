const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getLines, createLine, updateLine, getEquipment, addEquipment } = require('../controllers/linesController');

router.get('/',                     authenticate, getLines);
router.post('/',                    authenticate, requireRole('ADMIN','GLOBAL_ADMIN'), createLine);
router.patch('/:id',                authenticate, requireRole('ADMIN','GLOBAL_ADMIN'), updateLine);
router.get('/:lineId/equipment',    authenticate, getEquipment);
router.post('/:lineId/equipment',   authenticate, requireRole('ADMIN','GLOBAL_ADMIN'), addEquipment);

module.exports = router;