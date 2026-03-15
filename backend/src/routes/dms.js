const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { createEntry, getEntries, getStats, exportEntries, reviewEntry } = require('../controllers/dmsController');

// All DMS routes require authentication
router.use(authenticate);

// Routes for each DMS app module
// :appId can be: production, qse, maintenance, hr, stores
router.get('/:appId', getEntries);
router.get('/:appId/stats', getStats);
router.get('/:appId/export', exportEntries);
router.post('/:appId', createEntry);

// Approval workflow (production only, supervisor+)
router.put('/:appId/:id/review',
    requireRole('SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN', 'GLOBAL_ADMIN'),
    reviewEntry
);

module.exports = router;
