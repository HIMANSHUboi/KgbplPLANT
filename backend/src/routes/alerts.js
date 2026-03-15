const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAlerts, markRead, getUnreadCount, deleteAlert, bulkDeleteAlerts } = require('../controllers/alertsController');

router.get('/', authenticate, getAlerts);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:id/read', authenticate, markRead);
router.delete('/:id', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), deleteAlert);
router.post('/bulk-delete', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), bulkDeleteAlerts);

module.exports = router;
