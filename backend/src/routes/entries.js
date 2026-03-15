const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const {
  getEntries, createEntry, updateEntryStatus, getStats, exportEntries
} = require('../controllers/entriesController');

const entryValidation = [
  body('date').isDate(),
  body('shift').notEmpty(),
  body('department').notEmpty(),
  body('qty').isInt({ min: 1 }),
  body('downtime').isInt({ min: 0 }).optional(),
];

router.get('/',        authenticate, getEntries);
router.post('/',       authenticate, entryValidation, validate, createEntry);
router.patch('/:id/status', authenticate, requireRole('SUPERVISOR', 'ADMIN'), updateEntryStatus);
router.get('/stats',   authenticate, requireRole('SUPERVISOR', 'ADMIN'), getStats);
router.get('/export',  authenticate, requireRole('ADMIN'), exportEntries);

module.exports = router;