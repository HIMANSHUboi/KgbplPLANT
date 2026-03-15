const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getEmployeePerformance } = require('../controllers/performanceController');

router.use(authenticate);

// Admin-only performance endpoint
router.get('/',
    requireRole('ADMIN', 'GLOBAL_ADMIN'),
    getEmployeePerformance
);

module.exports = router;
