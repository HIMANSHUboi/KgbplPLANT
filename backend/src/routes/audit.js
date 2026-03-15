const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/', authenticate, requireRole('ADMIN'), getAuditLogs);

module.exports = router;
