const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getShiftLogs, createShiftLog, updateLogStatus, getPlantStats, exportLogs } = require('../controllers/shiftLogsController');

router.get('/',            authenticate, getShiftLogs);
router.post('/',           authenticate, createShiftLog);
router.patch('/:id/status',authenticate, requireRole('SHIFT_SUPERVISOR','PLANT_MANAGER','ADMIN','GLOBAL_ADMIN'), updateLogStatus);
router.get('/stats',       authenticate, requireRole('SHIFT_SUPERVISOR','PLANT_MANAGER','ADMIN','GLOBAL_ADMIN'), getPlantStats);
router.get('/export',      authenticate, requireRole('PLANT_MANAGER','ADMIN','GLOBAL_ADMIN'), exportLogs);

module.exports = router;